import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, getCheckIns, hasCheckedInToday, createClient, createSymptom, seedDemoData } from '../lib/store';
import type { Client } from '../types/database';
import { formatDate } from '../lib/utils';
import { UserPlus, CheckCircle, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AdminClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newClient, setNewClient] = useState({
    full_name: '',
    email: '',
    primary_complaint: '',
    next_appointment: '',
    symptoms: '',
  });

  useEffect(() => {
    seedDemoData();
    setClients(getClients());
  }, []);

  function handleCreate() {
    if (!newClient.full_name || !newClient.primary_complaint) return;

    const client = createClient({
      full_name: newClient.full_name,
      email: newClient.email,
      practitioner_id: 'demo-practitioner',
      next_appointment: newClient.next_appointment || null,
      primary_complaint: newClient.primary_complaint,
      notes: null,
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

    setClients(getClients());
    setShowForm(false);
    setNewClient({ full_name: '', email: '', primary_complaint: '', next_appointment: '', symptoms: '' });
  }

  return (
    <div className="admin-clients-page">
      <div className="admin-page-header">
        <h2>Clients</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <UserPlus size={16} /> Add Client
        </button>
      </div>

      {showForm && (
        <div className="card add-client-form">
          <h3>New Client</h3>
          <input
            type="text"
            placeholder="Full name"
            value={newClient.full_name}
            onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={newClient.email}
            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="Primary complaint"
            value={newClient.primary_complaint}
            onChange={(e) => setNewClient({ ...newClient, primary_complaint: e.target.value })}
          />
          <input
            type="text"
            placeholder="Symptoms to track (comma-separated)"
            value={newClient.symptoms}
            onChange={(e) => setNewClient({ ...newClient, symptoms: e.target.value })}
          />
          <input
            type="date"
            placeholder="Next appointment"
            value={newClient.next_appointment}
            onChange={(e) => setNewClient({ ...newClient, next_appointment: e.target.value })}
          />
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate}>Create</button>
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
                <p className="acr-complaint">{client.primary_complaint}</p>
                <div className="acr-meta">
                  <span>{checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}</span>
                  {client.next_appointment && (
                    <span>Next: {formatDate(client.next_appointment)}</span>
                  )}
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
