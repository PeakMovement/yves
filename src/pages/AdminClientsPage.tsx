import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, getCheckIns, hasCheckedInToday, createClient, createSymptom } from '../lib/store';
import type { Client } from '../types/database';
import { formatDate } from '../lib/utils';
import { UserPlus, CheckCircle, AlertCircle, AlertTriangle, ArrowRight, Copy, Check, Calendar } from 'lucide-react';

export default function AdminClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  const [copied, setCopied] = useState(false);
  const [newClient, setNewClient] = useState({
    full_name: '',
    primary_complaint: '',
    symptoms: '',
    tracking_duration_weeks: '' as string,
  });

  useEffect(() => {
    setClients(getClients());
  }, []);

  function handleCreate() {
    if (!newClient.full_name.trim()) return;

    const weeks = newClient.tracking_duration_weeks ? parseInt(newClient.tracking_duration_weeks, 10) : null;
    const client = createClient({
      full_name: newClient.full_name.trim(),
      email: '',
      practitioner_id: 'demo-practitioner',
      next_appointment: null,
      primary_complaint: newClient.primary_complaint,
      notes: null,
      tracking_duration_weeks: weeks && weeks > 0 ? weeks : null,
    });

    if (newClient.symptoms.trim()) {
      newClient.symptoms.split(',').forEach((s) => {
        const name = s.trim();
        if (name) {
          createSymptom({
            client_id: client.id,
            name,
            body_area: '',
            active: true,
          });
        }
      });
    }

    setCreatedClient(client);
    setClients(getClients());
    setNewClient({ full_name: '', primary_complaint: '', symptoms: '', tracking_duration_weeks: '' });
  }

  function handleCopyCode() {
    if (createdClient) {
      navigator.clipboard.writeText(createdClient.login_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          <div className="tracking-duration-field">
            <label className="field-label">
              <Calendar size={14} />
              Tracking duration
            </label>
            <div className="duration-options">
              {[
                { value: '', label: 'No end date' },
                { value: '1', label: '1 week' },
                { value: '2', label: '2 weeks' },
                { value: '4', label: '4 weeks' },
                { value: '6', label: '6 weeks' },
                { value: '8', label: '8 weeks' },
                { value: '12', label: '12 weeks' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`duration-btn ${newClient.tracking_duration_weeks === opt.value ? 'selected' : ''}`}
                  onClick={() => setNewClient({ ...newClient, tracking_duration_weeks: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {newClient.tracking_duration_weeks && (
              <p className="duration-hint">
                Client check-ins will end on{' '}
                <strong>
                  {formatDate(
                    new Date(
                      Date.now() + parseInt(newClient.tracking_duration_weeks, 10) * 7 * 24 * 60 * 60 * 1000
                    ).toISOString()
                  )}
                </strong>
              </p>
            )}
          </div>
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
          <p className="created-instruction">Share this login code with your client so they can access their check-in portal:</p>
          <div className="login-code-display">
            <span className="login-code-value">{createdClient.login_code}</span>
            <button className="btn btn-ghost btn-sm copy-btn" onClick={handleCopyCode}>
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <p className="created-hint">This code is unique to this client. They'll enter it at the Client Portal to log in.</p>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={handleDismiss}>Done</button>
            <button className="btn btn-primary btn-sm" onClick={() => { setCreatedClient(null); }}>
              Add Another
            </button>
          </div>
        </div>
      )}

      <div className="admin-client-list">
        {clients.map((client) => {
          const checkIns = getCheckIns(client.id);
          const done = hasCheckedInToday(client.id);
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
                <ArrowRight size={16} className="acr-arrow" />
              </div>
            </div>
          );
        })}

        {clients.length === 0 && (
          <div className="empty-state">
            <p>No clients yet. Add your first client to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
