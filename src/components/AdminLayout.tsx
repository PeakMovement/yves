import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Lock } from 'lucide-react';
import { getPractitionerByLoginCode } from '../lib/store';
import type { Practitioner } from '../types/database';

const ADMIN_CODE = '1313';
const ADMIN_SESSION_KEY = 'buddy_admin_authed';
const PRACTITIONER_SESSION_KEY = 'buddy_practitioner_id';

export function getLoggedInPractitioner(): { type: 'admin' | 'practitioner'; practitionerId?: string } | null {
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') {
    return { type: 'admin' };
  }
  const pid = sessionStorage.getItem(PRACTITIONER_SESSION_KEY);
  if (pid) return { type: 'practitioner', practitionerId: pid };
  return null;
}

function AdminGate({ onUnlock }: { onUnlock: (practitioner?: Practitioner) => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = code.trim();

    // Check admin code first
    if (trimmed === ADMIN_CODE) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      sessionStorage.removeItem(PRACTITIONER_SESSION_KEY);
      onUnlock();
      return;
    }

    // Check practitioner codes
    setLoading(true);
    const practitioner = await getPractitionerByLoginCode(trimmed.toUpperCase());
    setLoading(false);

    if (practitioner) {
      sessionStorage.setItem(PRACTITIONER_SESSION_KEY, practitioner.id);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      onUnlock(practitioner);
      return;
    }

    setError('Incorrect access code.');
  }

  return (
    <div className="client-login">
      <button className="btn btn-ghost back-link" onClick={() => navigate('/')}>
        &larr; Back
      </button>
      <div className="login-card">
        <div className="login-icon">
          <Lock size={32} />
        </div>
        <h2>Practitioner Access</h2>
        <p>Enter your access code to continue.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="code-input"
            placeholder="Access code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            autoFocus
            autoComplete="off"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Checking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [authed, setAuthed] = useState(false);
  const [practitionerName, setPractitionerName] = useState<string | null>(null);

  useEffect(() => {
    const session = getLoggedInPractitioner();
    if (session) setAuthed(true);
  }, []);

  if (!authed) {
    return <AdminGate onUnlock={(p) => {
      setAuthed(true);
      if (p) setPractitionerName(p.full_name);
    }} />;
  }

  const session = getLoggedInPractitioner();
  const isAdmin = session?.type === 'admin';

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(PRACTITIONER_SESSION_KEY);
    setAuthed(false);
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">B</div>
          <div>
            <h1>Buddy</h1>
            <span className="brand-tagline">
              {isAdmin ? 'Admin Portal' : `${practitionerName || 'Practitioner'}`}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/clients" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Clients</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
