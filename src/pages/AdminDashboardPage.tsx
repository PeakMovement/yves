import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, getCheckIns, hasCheckedInToday } from '../lib/store';
import type { Client } from '../types/database';
import { formatDate } from '../lib/utils';
import {
  Users,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    setClients(getClients());
  }, []);

  const totalClients = clients.length;
  const checkedInToday = clients.filter((c) => hasCheckedInToday(c.id)).length;
  const flaggedToday = clients.filter((c) => {
    const checkIns = getCheckIns(c.id);
    return checkIns.length > 0 && checkIns[0].flagged;
  }).length;
  const totalCheckIns = clients.reduce((sum, c) => sum + getCheckIns(c.id).length, 0);

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h2>Dashboard</h2>
        <p className="admin-date">Today is {formatDate(new Date().toISOString())}</p>
      </div>

      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: '#eef2ff', color: '#6366f1' }}>
            <Users size={20} />
          </div>
          <div>
            <span className="dash-stat-value">{totalClients}</span>
            <span className="dash-stat-label">Total Clients</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="dash-stat-value">{checkedInToday}/{totalClients}</span>
            <span className="dash-stat-label">Checked In Today</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="dash-stat-value">{flaggedToday}</span>
            <span className="dash-stat-label">Flagged</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>
            <ClipboardCheck size={20} />
          </div>
          <div>
            <span className="dash-stat-value">{totalCheckIns}</span>
            <span className="dash-stat-label">Total Check-ins</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Client Overview</h3>
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
    </div>
  );
}
