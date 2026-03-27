import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, getCheckIns, hasCheckedInToday, createClient, createSymptom, deleteClient, getClientsByPractitioner } from '../lib/store';
import { getLoggedInPractitioner } from '../components/AdminLayout';
import { sendWelcomeEmail, getWebhookUrl, setWebhookUrl } from '../lib/email';
import type { Client, CheckIn } from '../types/database';
import { formatDate } from '../lib/utils';
import { UserPlus, CheckCircle, AlertCircle, AlertTriangle, ArrowRight, Copy, Check, Calendar, Trash2, Mail, Send, Settings, X, Loader } from 'lucide-react';

interface ClientRow {
  client: Client;
  checkIns: CheckIn[];
  done: boolean;
}

export default function AdminClientsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; error?: string } | null>(null);
  const [createError, setCreateError] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [webhookUrl, setWebhookUrlState] = useState(getWebhookUrl());
  const [newClient, setNewClient] = useState({
    full_name: '',
    email: '',
    primary_complaint: '',
    symptoms: '',
    tracking_end_date: '',
    custom_code: '',
  });

  const session = getLoggedInPractitioner();

  async function loadClients() {
    const clients = session?.type === 'admin'
      ? await getClients()
      : session?.practitionerId
        ? await getClientsByPractitioner(session.practitionerId)
        : [];
    const result: ClientRow[] = [];
    for (const client of clients) {
      const checkIns = await getCheckIns(client.id);
      const done = await hasCheckedInToday(client.id);
      result.push({ client, checkIns, done });
    }
    setRows(result);
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleCreate() {
    if (!newClient.full_name.trim()) return;
    setCreateError('');

    let weeks: number | null = null;
    if (newClient.tracking_end_date) {
      const diffMs = new Date(newClient.tracking_end_date).getTime() - Date.now();
      weeks = Math.max(1, Math.round(diffMs / (7 * 24 * 60 * 60 * 1000)));
    }

    let client;
    try {
      client = await createClient({
        full_name: newClient.full_name.trim(),
        email: newClient.email.trim(),
        practitioner_id: session?.practitionerId || 'admin',
        next_appointment: null,
        primary_complaint: newClient.primary_complaint,
        notes: null,
        tracking_duration_weeks: weeks,
        tracking_end_date_override: newClient.tracking_end_date || null,
        custom_login_code: newClient.custom_code.trim() || undefined,
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create client.');
      return;
    }

    if (newClient.symptoms.trim()) {
      const parts = newClient.symptoms.split(',');
      for (const s of parts) {
        const name = s.trim();
        if (name) {
          await createSymptom({
            client_id: client.id,
            name,
            body_area: '',
            active: true,
          });
        }
      }
    }

    setCreatedClient(client);
    await loadClients();
    setEmailStatus(null);

    if (sendEmail && newClient.email.trim()) {
      setSendingEmail(true);
      const result = await sendWelcomeEmail({
        client_name: client.full_name,
        client_email: newClient.email.trim(),
        login_code: client.login_code,
        app_url: `${window.location.origin}/app/login`,
      });
      setSendingEmail(false);
      setEmailStatus({ sent: result.success, error: result.error });
    }

    setNewClient({ full_name: '', email: '', primary_complaint: '', symptoms: '', tracking_end_date: '', custom_code: '' });
  }

  function handleSaveWebhook() {
    setWebhookUrl(webhookUrl);
    setShowWebhookConfig(false);
  }

  async function handleResendEmail() {
    if (!createdClient || !createdClient.email) return;
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

  function handleCopyCode() {
    if (createdClient) {
      navigator.clipboard.writeText(createdClient.login_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDelete(e: React.MouseEvent, clientId: string, name: string) {
    e.stopPropagation();
    if (window.confirm(`Delete ${name}? This will remove all their check-in data.`)) {
      await deleteClient(clientId);
      await loadClients();
    }
  }

  function handleDismiss() {
    setCreatedClient(null);
    setShowForm(false);
  }

  return (
    <div className="admin-clients-page">
      <div className="admin-page-header">
        <h2>Clients</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setCreatedClient(null); }}>
          <UserPlus size={16} /> Add Client
        </button>
      </div>

      {showForm && !createdClient && (
        <div className="card add-client-form">
          <h3>New Client</h3>
          <input
            type="text"
            placeholder="Full name"
            value={newClient.full_name}
            onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
            autoFocus
          />
          <input
            type="email"
            placeholder="Email address"
            value={newClient.email}
            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="Primary complaint (optional)"
            value={newClient.primary_complaint}
            onChange={(e) => setNewClient({ ...newClient, primary_complaint: e.target.value })}
          />
          <input
            type="text"
            placeholder="Symptoms to track (comma-separated, optional)"
            value={newClient.symptoms}
            onChange={(e) => setNewClient({ ...newClient, symptoms: e.target.value })}
          />
          <input
            type="text"
            placeholder="Custom login code (optional, auto-generated if empty)"
            value={newClient.custom_code}
            onChange={(e) => setNewClient({ ...newClient, custom_code: e.target.value.toUpperCase() })}
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
              value={newClient.tracking_end_date}
              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
              onChange={(e) => setNewClient({ ...newClient, tracking_end_date: e.target.value })}
            />
            {newClient.tracking_end_date && (
              <p className="duration-hint">
                Buddy will track this client until{' '}
                <strong>{formatDate(newClient.tracking_end_date)}</strong>, then let them know it's time to see the physio.
              </p>
            )}
          </div>

          {newClient.email.trim() && (
            <div className="email-toggle-row">
              <label className="email-toggle">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                <Mail size={14} />
                <span>Send welcome email with login code</span>
              </label>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowWebhookConfig(!showWebhookConfig)} title="Configure email webhook">
                <Settings size={14} />
              </button>
            </div>
          )}

          {showWebhookConfig && (
            <div className="webhook-config">
              <label className="field-label">
                <Settings size={14} />
                Email webhook URL (Make.com / Zapier)
              </label>
              <div className="webhook-input-row">
                <input
                  type="url"
                  placeholder="https://hook.make.com/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrlState(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" onClick={handleSaveWebhook}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowWebhookConfig(false)}>
                  <X size={14} />
                </button>
              </div>
              <p className="duration-hint">Paste your Make.com or Zapier webhook URL here. The app will POST client_name, client_email, login_code, and app_url.</p>
            </div>
          )}

          {createError && <p className="login-error">{createError}</p>}

          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!newClient.full_name.trim()}>
              Create Client
            </button>
          </div>
        </div>
      )}

      {createdClient && (
        <div className="card created-client-card">
          <div className="created-success">
            <CheckCircle size={24} color="#10b981" />
            <h3>Client created</h3>
          </div>
          <p className="created-name">{createdClient.full_name}</p>
          {createdClient.email && (
            <p className="created-email">{createdClient.email}</p>
          )}
          <p className="created-instruction">Share this login code with your client so they can access their check-in portal:</p>
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

          {emailStatus && emailStatus.sent && (
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

          <p className="created-hint">This code is unique to this client. They'll enter it at the Client Portal to log in.</p>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={handleDismiss}>Done</button>
            <button className="btn btn-primary btn-sm" onClick={() => { setCreatedClient(null); setEmailStatus(null); }}>
              Add Another
            </button>
          </div>
        </div>
      )}

      <div className="admin-client-list">
        {rows.map(({ client, checkIns, done }) => {
          const lastCheckIn = checkIns[0];
          const hasFlagged = lastCheckIn?.flagged;

          return (
            <div
              key={client.id}
              className={`admin-client-row ${hasFlagged ? 'flagged-row' : ''}`}
              onClick={() => navigate(`/admin/clients/${client.id}`)}
            >
              <div className="acr-info">
                <div className="acr-name-row">
                  <h4>{client.full_name}</h4>
                  {hasFlagged && <AlertTriangle size={14} color="#f59e0b" />}
                </div>
                {client.primary_complaint && (
                  <p className="acr-complaint">{client.primary_complaint}</p>
                )}
                <div className="acr-meta">
                  <span className="acr-code">Code: {client.login_code}</span>
                  <span>{checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}</span>
                  {lastCheckIn && <span>Last: {formatDate(lastCheckIn.created_at)}</span>}
                </div>
              </div>
              <div className="acr-right">
                {done ? (
                  <span className="status-badge done"><CheckCircle size={14} /> Done</span>
                ) : (
                  <span className="status-badge pending"><AlertCircle size={14} /> Awaiting</span>
                )}
                <button
                  className="btn btn-ghost btn-sm delete-client-btn"
                  onClick={(e) => handleDelete(e, client.id, client.full_name)}
                  title="Delete client"
                >
                  <Trash2 size={14} />
                </button>
                <ArrowRight size={16} className="acr-arrow" />
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="empty-state">
            <p>No clients yet. Add your first client to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
