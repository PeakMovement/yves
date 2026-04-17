# Supabase Backend Security & Architecture Review

**Date:** 2026-04-17  
**Project:** Yves (Buddy Symptom Tracking App)  
**Reviewer:** Claude AI

---

## Executive Summary

The Supabase backend has **critical security vulnerabilities** that must be addressed before production use. The most severe issues include:

1. **Exposed credentials in client-side code** (CRITICAL)
2. **Overly permissive RLS policies** (CRITICAL)
3. **Client-side password hashing** (CRITICAL)
4. **Missing database schema** for practitioners table (HIGH)
5. **No data validation at database layer** (HIGH)
6. **Unencrypted sensitive data** (HIGH)

---

## 1. CRITICAL SECURITY ISSUES

### 1.1 Exposed Supabase Credentials (CRITICAL)

**Location:** `src/lib/supabase.ts` (lines 3-4)

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://teehpkaxgqnzwqtmxfhe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Issues:**
- Hardcoded Supabase URL and JWT anonymous key in source code
- These credentials are visible in browser DevTools and network requests
- The anon key allows ANY unauthenticated user to access the database
- If this code is committed to public repositories, credentials are permanently compromised

**Impact:**
- Anyone with access to the source code can:
  - Read all client, practitioner, and health data
  - Modify or delete any records
  - Create fake practitioners and clients
  - Impersonate users

**Remediation:**
- ✅ **Remove hardcoded credentials immediately**
- Ensure `.env.local` is in `.gitignore` (check this)
- Use environment variables only (no fallback values)
- If credentials are already public, regenerate them in Supabase dashboard
- Consider adding a pre-commit hook to prevent credential commits

**Risk Level:** CRITICAL - Stop deployment until fixed

---

### 1.2 Overly Permissive Row-Level Security (RLS) Policies (CRITICAL)

**Location:** `supabase-schema.sql` (lines 66-78)

```sql
-- CURRENT (INSECURE):
create policy "Allow all for anon" on clients for all using (true) with check (true);
create policy "Allow all for anon" on symptoms for all using (true) with check (true);
create policy "Allow all for anon" on check_ins for all using (true) with check (true);
create policy "Allow all for anon" on symptom_entries for all using (true) with check (true);
create policy "Allow all for anon" on device_visits for all using (true) with check (true);
```

**Issues:**
- `using (true)` and `with check (true)` mean **no access control at all**
- Any anonymous user can read/write/delete all rows in all tables
- RLS is technically enabled but completely bypassed
- This defeats the purpose of using Supabase's security layer

**Impact:**
- **Complete data exposure:** Any user can view all other users' health data
- **Data integrity loss:** Anyone can modify or delete any record
- **Privacy violation:** HIPAA/GDPR violations with sensitive health information
- **Privilege escalation:** Clients can modify other clients' data

**Remediation:**
Implement proper RLS policies based on user roles:

```sql
-- Example: Only allow users to see their own data
-- Requires proper authentication setup with user IDs in JWT claims

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own clients" ON clients
  FOR SELECT USING (
    -- Assuming practitioner_id is stored in auth JWT
    auth.jwt()->>'sub' = practitioner_id
  );

CREATE POLICY "Users can only update their own clients" ON clients
  FOR UPDATE USING (
    auth.jwt()->>'sub' = practitioner_id
  );

CREATE POLICY "Users can only delete their own clients" ON clients
  FOR DELETE USING (
    auth.jwt()->>'sub' = practitioner_id
  );
```

**Risk Level:** CRITICAL - Data exposure to all users

---

### 1.3 Client-Side Password Hashing (CRITICAL)

**Location:** `src/lib/store.ts` (lines 840-851)

```typescript
// Simple password hash for client-side use (NOT production-grade)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
```

**Issues:**
- Uses an extremely weak hash function (DJB2 variant, not cryptographic)
- No salt or per-user salt
- Hashes are **deterministic** - same password always produces same hash
- Can be reversed or brute-forced easily
- Passwords are sent in plaintext over HTTPS before hashing
- Client-side hashing provides no security (code is visible to users)

**Impact:**
- **Password cracking:** Practitioners' passwords are vulnerable to offline attacks
- **Rainbow table attacks:** Pre-computed hash tables can crack these instantly
- **No protection from network sniffing:** Initial password is in plaintext
- **Audit trail:** Password history exposed if hashes are logged

**Remediation:**
- ✅ **Move authentication to Supabase Auth or a dedicated auth service**
- Use bcrypt, Argon2, or scrypt on the server (Supabase handles this with Auth)
- Never hash passwords in the client
- Use HTTPS for all connections (already done)

**Implementation:**
```typescript
// Use Supabase Auth instead
import { createClient } from '@supabase/supabase-js';

const { data, error } = await supabase.auth.signUpWithPassword({
  email: practitioner.email,
  password: password
});
```

**Risk Level:** CRITICAL - Authentication compromise

---

### 1.4 Hardcoded Default Credentials (CRITICAL)

**Location:** `src/lib/initPractitioners.ts` (lines 9-16)

```typescript
const DEFAULT_PRACTITIONERS: DefaultPractitioner[] = [
  { name: 'Zoe', loginCode: '1001', initialPassword: 'password' },
  { name: 'Justin', loginCode: '1002', initialPassword: 'password' },
  // ... all with password 'password'
];
```

**Issues:**
- All default practitioners use the same password: `'password'`
- Login codes are sequential (1001-1006) and guessable
- These hardcoded defaults will be committed to version control
- If demo/test data persists in production, accounts are compromised

**Impact:**
- Anyone can log in as any practitioner with password `'password'`
- System is functionally insecure from first deployment
- No account security whatsoever

**Remediation:**
- Remove hardcoded defaults or only use them in development/testing
- Generate random strong passwords during setup
- Prompt practitioners to change passwords on first login
- Use Supabase Auth's built-in signup flow

**Risk Level:** CRITICAL - System access

---

## 2. HIGH PRIORITY ISSUES

### 2.1 Missing Practitioners Table in Schema (HIGH)

**Location:** `supabase-schema.sql`

**Issue:**
- Code references a `practitioners` table extensively (store.ts lines 798-929)
- This table is NOT defined in the provided schema
- The schema is incomplete

**Questions:**
- Where is the practitioners table created?
- What columns does it have?
- Is it properly indexed?

**Remediation:**
Add the missing schema:
```sql
CREATE TABLE IF NOT EXISTS practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  login_code TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_practitioners_login_code ON practitioners(login_code);
CREATE INDEX idx_practitioners_email ON practitioners(email);
```

**Risk Level:** HIGH - Data model integrity

---

### 2.2 No Data Validation at Database Layer (HIGH)

**Location:** `supabase-schema.sql` - All tables

**Issues:**
- No NOT NULL constraints on critical fields
- No UNIQUE constraints where needed (e.g., email should be unique)
- No CHECK constraints for enum-like fields (except check_ins)
- No DEFAULT values for important fields
- `email` field on clients has `default ''` (empty string, not NULL)
- No character limits on text fields
- No date validation

**Examples of problematic fields:**
```sql
-- CURRENT (PROBLEMATIC):
full_name text not null,  -- No length limit
email text not null default '', -- Empty default is confusing
notes text,  -- No length limit

-- SHOULD BE:
full_name VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL UNIQUE DEFAULT '',
notes VARCHAR(2000) DEFAULT NULL,
```

**Impact:**
- Invalid data can be inserted (e.g., empty emails as defaults)
- No data integrity guarantees
- Client code must implement all validation (error-prone)
- Database doesn't prevent data corruption

**Remediation:**
Add comprehensive constraints:
```sql
-- Add constraints to clients table
ALTER TABLE clients ADD CONSTRAINT check_email_not_empty 
  CHECK (email <> '');
ALTER TABLE clients ADD CONSTRAINT check_full_name_length
  CHECK (LENGTH(full_name) > 0 AND LENGTH(full_name) <= 255);
ALTER TABLE clients ADD UNIQUE(email);

-- Add length constraints
ALTER TABLE clients ALTER COLUMN notes TYPE VARCHAR(5000);
ALTER TABLE symptoms ALTER COLUMN name TYPE VARCHAR(255) NOT NULL;
```

**Risk Level:** HIGH - Data integrity

---

### 2.3 Contact Requests & Symptom Queries Tables Missing (HIGH)

**Location:** `src/lib/store.ts` (lines 933-976)

**Issue:**
- Code inserts into `contact_requests` and `symptom_queries` tables
- These tables are NOT defined in the schema
- Will fail at runtime with "table not found" errors

**Remediation:**
Add missing tables to schema:
```sql
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  symptom_description TEXT NOT NULL,
  symptom_score SMALLINT NOT NULL CHECK (symptom_score BETWEEN 0 AND 10),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS symptom_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  symptom_description TEXT NOT NULL,
  red_flag_detected BOOLEAN NOT NULL,
  confidence_score SMALLINT NOT NULL CHECK (confidence_score BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_requests_client_id ON contact_requests(client_id);
CREATE INDEX idx_contact_requests_practitioner_id ON contact_requests(practitioner_id);
CREATE INDEX idx_contact_requests_is_read ON contact_requests(is_read);
CREATE INDEX idx_symptom_queries_client_id ON symptom_queries(client_id);
CREATE INDEX idx_symptom_queries_red_flag_detected ON symptom_queries(red_flag_detected);
```

**Risk Level:** HIGH - Runtime errors

---

## 3. MEDIUM PRIORITY ISSUES

### 3.1 No Indexes on Foreign Keys (MEDIUM)

**Issue:**
- Tables have foreign key constraints but no indexes on foreign keys
- This causes full table scans for common queries

**Example:**
```sql
-- symptom_entries has foreign keys but no indexes
create table symptom_entries (
  check_in_id uuid not null references check_ins(id),  -- NO INDEX!
  symptom_id uuid not null references symptoms(id)  -- NO INDEX!
);
```

**Remediation:**
```sql
CREATE INDEX idx_symptom_entries_check_in_id ON symptom_entries(check_in_id);
CREATE INDEX idx_symptom_entries_symptom_id ON symptom_entries(symptom_id);
CREATE INDEX idx_symptoms_client_id ON symptoms(client_id);
CREATE INDEX idx_check_ins_client_id ON check_ins(client_id);
```

**Risk Level:** MEDIUM - Performance degradation

---

### 3.2 Device Visits Tracking Privacy Concern (MEDIUM)

**Location:** `supabase-schema.sql` (lines 54-63)

```sql
create table device_visits (
  client_id uuid references clients(id) on delete set null,  -- Can be NULL
  user_agent text not null default '',
  screen_width int not null default 0,
  screen_height int not null default 0,
  visited_at timestamptz not null default now(),
  page text not null default ''
);
```

**Issues:**
- Storing `user_agent` and `screen_width/height` can fingerprint users
- No consent mechanism for tracking
- No data retention policy (data persists indefinitely)
- Can be used to track unauthenticated users across sessions

**Remediation:**
- Add data retention policy
- Add user consent tracking
- Anonymize or truncate user_agent
- Add GDPR-compliant deletion mechanism

```sql
ALTER TABLE device_visits ADD COLUMN consent_given BOOLEAN DEFAULT false;
ALTER TABLE device_visits ADD COLUMN expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '90 days';
CREATE INDEX idx_device_visits_expires_at ON device_visits(expires_at);
```

**Risk Level:** MEDIUM - Privacy/GDPR compliance

---

### 3.3 Login Code Generation Not Unique (MEDIUM)

**Location:** `src/lib/store.ts` (lines 52-57)

```typescript
async function generateUniqueLoginCode(): Promise<string> {
  const code = generateLoginCode();
  const existing = await getClients();
  if (existing.some((c) => c.login_code === code)) return generateUniqueLoginCode();
  return code;
}
```

**Issues:**
- Recursive uniqueness check (can cause stack overflow)
- No database-level uniqueness enforcement (app-level only)
- Race condition: two simultaneous requests could generate same code
- No deduplication on retry

**Remediation:**
- Add UNIQUE constraint to database
- Use database-level generation or use UUID

```sql
ALTER TABLE clients ADD CONSTRAINT unique_login_code UNIQUE(login_code);
ALTER TABLE practitioners ADD CONSTRAINT unique_login_code UNIQUE(login_code);
```

**Risk Level:** MEDIUM - Data integrity, race conditions

---

### 3.4 Red Flag Detection Scoring Logic (MEDIUM)

**Location:** `src/lib/store.ts` (lines 249-374)

**Issues:**
- Complex scoring algorithm runs on every check-in
- No medical review of scoring weights
- Hard-coded keywords may miss important symptoms
- No way to update scoring without code changes
- False positives could alarm practitioners
- False negatives could miss red flags

**Concerns:**
```typescript
// These weights are arbitrary and unvetted
const keywordGroups = {
  'neuro_tingling': { score: 6 },
  'neuro_numbness': { score: 7 },
  'neuro_weakness': { score: 7 },
  // ...
};
```

**Remediation:**
- Have medical professionals review scoring
- Move scoring rules to database (configurable)
- Add audit logging for flagged check-ins
- Implement version control for scoring rules
- Add sensitivity/specificity analysis

**Risk Level:** MEDIUM - Clinical safety

---

## 4. LOW PRIORITY ISSUES

### 4.1 Missing TypeScript Interfaces in Database Schema (LOW)

- Practitioner interface references `password_hash` field
- Check if all fields in types match actual schema

**Remediation:**
- Run `npx supabase gen types typescript` to auto-generate types

---

### 4.2 Endpoint Injection Risk (LOW)

**Location:** `src/lib/email.ts` (lines 22-42)

```typescript
const url = getWebhookUrl();
// ... no validation of URL format
const res = await fetch(url, { ... });
```

**Issues:**
- Webhook URL is not validated before use
- Could be used for SSRF attacks if URL is user-controlled
- No timeout on webhook requests

**Remediation:**
```typescript
function isValidWebhookUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

if (!isValidWebhookUrl(url)) {
  throw new Error('Invalid webhook URL');
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);
const res = await fetch(url, { signal: controller.signal });
clearTimeout(timeout);
```

**Risk Level:** LOW - SSRF, webhook reliability

---

### 4.3 No Audit Logging (LOW)

**Issues:**
- No record of who created/modified/deleted records
- No timestamp of modifications
- Cannot track data changes for compliance

**Remediation:**
- Add `updated_by` and `updated_at` fields to critical tables
- Create audit_log table for sensitive operations

**Risk Level:** LOW - Compliance/debugging

---

## 5. SECURITY BEST PRACTICES NOT IMPLEMENTED

| Feature | Status | Priority |
|---------|--------|----------|
| HTTPS Only | ✅ Assumed | N/A |
| CORS Configuration | ❌ Unknown | HIGH |
| Rate Limiting | ❌ Missing | HIGH |
| API Key Rotation | ❌ Manual | HIGH |
| Data Encryption at Rest | ❓ Depends on Supabase plan | HIGH |
| Backup & Recovery | ❓ Unknown | HIGH |
| Audit Logging | ❌ Missing | MEDIUM |
| Data Retention Policy | ❌ Missing | MEDIUM |
| GDPR Compliance | ❓ Unclear | HIGH |
| HIPAA Compliance | ❓ Not mentioned | HIGH |
| Penetration Testing | ❌ None | MEDIUM |
| Security Monitoring | ❌ Missing | MEDIUM |
| Incident Response Plan | ❌ Missing | MEDIUM |

---

## 6. ARCHITECTURE CONCERNS

### 6.1 No Separation of Concerns

- Authentication logic mixed with business logic
- Client-side validation also used for security
- No clear service boundaries

### 6.2 Supabase Configuration Unclear

- Project settings unknown
- Custom claims in JWT unknown
- Database roles configuration unknown

### 6.3 Deployment Pipeline

- No mention of environment-specific configs
- No secrets management mentioned
- No staged rollout plan

---

## 7. RECOMMENDATIONS

### Immediate Actions (Before Any Production Deployment)

1. **Regenerate and rotate Supabase credentials** ⚠️ CRITICAL
2. **Implement proper RLS policies** with authentication
3. **Set up Supabase Auth** for practitioner authentication
4. **Add database constraints** for data validation
5. **Remove hardcoded defaults** or isolate to dev environment
6. **Add missing schema tables**

### Short-term Improvements (Sprint 1)

1. Implement role-based access control
2. Add comprehensive input validation
3. Set up data encryption for sensitive fields
4. Create audit logging system
5. Implement rate limiting

### Medium-term Improvements (Sprint 2-3)

1. Security audit by qualified security professional
2. Penetration testing
3. Compliance review (GDPR, HIPAA if required)
4. Implement data retention policies
5. Set up security monitoring and alerting

### Ongoing

1. Regular security updates
2. Credential rotation schedule
3. Access review process
4. Incident response procedures
5. Security training for team

---

## 8. TESTING RECOMMENDATIONS

### Security Testing Checklist

- [ ] Attempt to access other users' data as unauthenticated user
- [ ] Attempt to modify other users' records
- [ ] Test SQL injection with special characters
- [ ] Test XSS with script tags in text fields
- [ ] Verify CORS headers are properly set
- [ ] Test password strength requirements
- [ ] Verify rate limiting works
- [ ] Test backup/restore procedures
- [ ] Verify audit logs capture all changes
- [ ] Test data deletion compliance

---

## 9. CONCLUSION

The current Supabase backend has **multiple critical security vulnerabilities** that make it unsuitable for production use, especially for handling sensitive health information.

**Do not deploy to production until:**
1. ✅ All CRITICAL issues are resolved
2. ✅ Credentials are rotated
3. ✅ RLS policies are properly configured
4. ✅ Authentication is migrated to Supabase Auth
5. ✅ Security testing confirms fixes

**Estimated effort:** 2-3 weeks for a security professional to implement all recommendations.

---

**Review completed:** 2026-04-17  
**Next review recommended:** After implementation of critical fixes
