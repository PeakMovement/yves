import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient, createSymptom, getPractitioners } from '../lib/store';
import { useActivePractitioner } from '../hooks/usePractitioner';
import { sendWelcomeEmail, getWebhookUrl } from '../lib/email';
import { formatDate } from '../lib/utils';
import type { Client, Practitioner } from '../types/database';
import {
  UserPlus, CheckCircle, Copy, Check, Calendar, Mail, Send,
  AlertTriangle, Loader
} from 'lucide-react';

export default function AdminAddClientPage() {
  const navigate = useNavigate();
  const currentPractitioner = useActivePractitioner();

  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    primary_complaint: '',
    symptoms: '',
    tracking_end_date: '',
    custom_code: '',
  });
  const [sendEmail, setSendEmail] = useState(true);
  const [createError, setCreateError] = useState('');
  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (currentPractitioner && !currentPractitioner.is_admin) {
      navigate('/admin');
      return;
    }
    (async () => {
      const list = await getPractitioners();
      setPractitioners(list);
      if (list.length > 0) setSelectedPractitioner(list[0].id);
    })();
  }, [currentPractitioner]);

  const webhookConfigured = !!getWebhookUrl();

  async function handleCreate() {
    if (!form.full_name.trim()) return;
    if (!selectedPractitioner) { setCreateError('Please select a practitioner.'); return; }
    setCreateError('');

    let client: Client;
    try {
      client = await createClient({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        practitioner_id: selectedPractitioner,
        next_appointment: null,
        primary_complaint: form.primary_complaint,
        notes: null,
        tracking_duration_weeks: null,
        tracking_end_date_override: form.tracking_end_date || null,
        custom_login_code: form.custom_code.trim() || undefined,
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create client.');
      return;
    }

    if (form.symptoms.trim()) {
      for (const s of form.symptoms.split(',')) {
        const name = s.trim();
        if (name) await createSymptom({ client_id: client.id, name, body_area: '', active: true });
      }
    }

    setCreatedClient(client);
    setEmailStatus(null);

    if (sendEmail && form.email.trim()) {
      setSendingEmail(true);
      const result = await sendWelcomeEmail({
        client_name: client.full_name,
        client_email: form.email.trim(),
        login_code: client.login_code,
        app_url: `${window.location.origin}/app/login`,
      });
      setSendingEmail(false);
      setEmailStatus({ sent: result.success, error: result.error });
    }
  }

  function handleCopyCode() {
    if (createdClient) {
      navigator.clipboard.writeText(createdClient.login_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleResendEmail() {
    if (!createdClient?.email) return;
    setSendingEmail(true);
    const result = await sendWelcomeEmail({
      client_name: createdClient.full_name,
      client_email: createdClient.email,
      login_code: createdClient.login_code,
      app_url: `${window.location.origin}/app/login`,
    });
    setSendingEmail(false);
    setEmailStatus({ sent: result.success, error: result.error });
  }

  function handleAddAnother() {
    setCreatedClient(null);
    setEmailStatus(null);
    setCopied(false);
    setForm({ full_name: '', email: '', primary_complaint: '', symptoms: '', tracking_end_date: '', custom_code: '' });
  }

  const assignedPractitioner = practitioners.find(p => p.id === (createdClient?.practitioner_id || selectedPractitioner));

  if (createdClient) {
    return (
      <div className="admin-clients-page">
        <div className="admin-page-header">
          <h2>Add Client</h2>
        </div>
        <div className="card created-client-card" style={{ maxWidth: 520 }}>
          <div className="created-success">
            <CheckCircle size={28} color="#10b981" />
            <h3>Client created</h3>
          </div>
          <p className="created-name">{createdClient.full_name}</p>
          {createdClient.email && <p className="created-email">{createdClient.email}</p>}
          {assignedPractitioner && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Assigned to <strong>{assignedPractitioner.name || assignedPractitioner.full_name}</strong>
            </p>
          )}
          <p className="created-instruction">Share this login code with your client:</p>
          <div className="login-code-display">
            <span className="login-code-value">{createdClient.login_code}</span>
            <button className="btn btn-ghost btn-sm copy-btn" onClick={handleCopyCode}>
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>

          {sendingEmail && (
            <div className="email-status sending">
              <Loader size={14} className="spin" />
              <span>Sending welcome email...</span>
            </div>
          )}
          {emailStatus?.sent && (
            <div className="email-status success">
              <Mail size={14} />
              <span>Welcome email sent to {createdClient.email}</span>
            </div>
          )}
          {emailStatus && !emailStatus.sent && (
            <div className="email-status error">
              <AlertTriangle size={14} />
              <span>{emailStatus.error}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleResendEmail}>
                <Send size={12} /> Retry
              </button>
            </div>
          )}
          {!emailStatus && !sendingEmail && createdClient.email && (
            <button className="btn btn-ghost btn-sm email-manual-send" onClick={handleResendEmail}>
              <Send size={14} /> Send welcome email
            </button>
          )}

          <p className="created-hint">This code is unique to this client.</p>
          <div className="form-actions">
            {assignedPractitioner && (
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/admin/practitioners')}
              >
                View practitioners
              </button>
            )}
            <button className="btn btn-primary" onClick={handleAddAnother}>
              Add another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-clients-page">
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserPlus size={22} style={{ color: 'var(--primary)' }} />
          <h2>Add Client</h2>
        </div>
      </div>

      <div className="card add-client-form" style={{ maxWidth: 560 }}>
        <div>
          <label className="form-label" htmlFor="practitioner">Assign to practitioner</label>
          <select
            id="practitioner"
            className="form-input"
            value={selectedPractitioner}
            onChange={e => setSelectedPractitioner(e.target.value)}
          >
            {practitioners.map(p => (
              <option key={p.id} value={p.id}>
                {p.name || p.full_name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Full name *"
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
          autoFocus
        />
        <input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="text"
          placeholder="Primary complaint (optional)"
          value={form.primary_complaint}
          onChange={e => setForm({ ...form, primary_complaint: e.target.value })}
        />
        <input
          type="text"
          placeholder="Symptoms to track (comma-separated, optional)"
          value={form.symptoms}
          onChange={e => setForm({ ...form, symptoms: e.target.value })}
        />
        <input
          type="text"
          placeholder="Custom login code (optional — auto-generated if empty)"
          value={form.custom_code}
          onChange={e => setForm({ ...form, custom_code: e.target.value.toUpperCase() })}
          maxLength={6}
          autoComplete="off"
        />

        <div className="tracking-duration-field">
          <label className="field-label" htmlFor="tracking-end-date">
            <Calendar size={14} />
            Tracking end date
          </label>
          <input
            id="tracking-end-date"
            type="date"
            className="date-picker-input"
            value={form.tracking_end_date}
            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
            onChange={e => setForm({ ...form, tracking_end_date: e.target.value })}
          />
          {form.tracking_end_date && (
            <p className="duration-hint">
              Buddy will track this client until <strong>{formatDate(form.tracking_end_date)}</strong>.
            </p>
          )}
        </div>

        {form.email.trim() && (
          <div className="email-toggle-row">
            <label className="email-toggle">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
              />
              <Mail size={14} />
              <span>Send welcome email with login code</span>
            </label>
            {!webhookConfigured && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                (Configure webhook in{' '}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0 4px', fontSize: 12, display: 'inline' }}
                  onClick={() => navigate('/admin/settings')}
                >
                  Settings
                </button>
                )
              </span>
            )}
          </div>
        )}

        {createError && <p className="login-error">{createError}</p>}

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!form.full_name.trim() || !selectedPractitioner}
          >
            Create Client
          </button>
        </div>
      </div>
    </div>
  );
}
