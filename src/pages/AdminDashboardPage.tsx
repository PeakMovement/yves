import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, getCheckIns, hasCheckedInToday, getDeviceAnalytics, getPractitioners, getClientsByPractitioner, calculateComplianceRating } from '../lib/store';
import { getLoggedInPractitioner } from '../components/AdminLayout';
import type { Client, CheckIn, Practitioner } from '../types/database';
import { formatDate } from '../lib/utils';
import {
  Users,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ClipboardCheck,
  ArrowRight,
  Smartphone,
  Tablet,
  Monitor,
  UserCheck,
} from 'lucide-react';

interface ClientRow {
  client: Client;
  checkIns: CheckIn[];
  done: boolean;
}

interface PractitionerStat {
  practitioner: Practitioner;
  clientCount: number;
  totalCheckIns: number;
  avgCompliance: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [practitionerStats, setPractitionerStats] = useState<PractitionerStat[]>([]);
  const [loading, setLoading] = useState(true);

  const session = getLoggedInPractitioner();
  const isAdmin = session?.type === 'admin';

  useEffect(() => {
    (async () => {
      // Load clients based on role
      let clients: Client[];
      if (isAdmin) {
        clients = await getClients();
      } else if (session?.practitionerId) {
        clients = await getClientsByPractitioner(session.practitionerId);
      } else {
        clients = [];
      }

      const result: ClientRow[] = [];
      for (const client of clients) {
        const checkIns = await getCheckIns(client.id);
        const done = await hasCheckedInToday(client.id);
        result.push({ client, checkIns, done });
      }
      setRows(result);

      // Admin: load practitioner stats
      if (isAdmin) {
        const practitioners = await getPractitioners();
        const stats: PractitionerStat[] = [];
        for (const p of practitioners) {
          const pClients = await getClientsByPractitioner(p.id);
          let totalCheckIns = 0;
          let complianceSum = 0;
          for (const c of pClients) {
            const cis = await getCheckIns(c.id);
            totalCheckIns += cis.length;
            const rating = calculateComplianceRating(c, cis);
            complianceSum += rating.score;
          }
          stats.push({
            practitioner: p,
            clientCount: pClients.length,
            totalCheckIns,
            avgCompliance: pClients.length > 0 ? Math.round(complianceSum / pClients.length) : 0,
          });
        }
        setPractitionerStats(stats);
      }

      setLoading(false);
    })();
  }, []);

  const deviceAnalytics = getDeviceAnalytics();
  const totalClients = rows.length;
  const checkedInToday = rows.filter((r) => r.done).length;
  const flaggedToday = rows.filter((r) => r.checkIns.length > 0 && r.checkIns[0].flagged).length;
  const totalCheckIns = rows.reduce((sum, r) => sum + r.checkIns.length, 0);

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h2>{isAdmin ? 'Admin Dashboard' : 'Dashboard'}</h2>
        <p className="admin-date">Today is {formatDate(new Date().toISOString())}</p>
      </div>

      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: '#eef2ff', color: '#6366f1' }}>
            <Users size={20} />
          </div>
          <div>
            <span className="dash-stat-value">{totalClients}</span>
            <span className="dash-stat-label">{isAdmin ? 'Total Clients' : 'My Clients'}</span>
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

      {/* Admin: Team Overview */}
      {isAdmin && practitionerStats.length > 0 && (
        <div className="dashboard-section" style={{ marginTop: 32 }}>
          <h3><UserCheck size={18} style={{ marginRight: 6 }} />Team Overview</h3>
          <div className="team-overview-grid">
            {practitionerStats.map(({ practitioner, clientCount, totalCheckIns, avgCompliance }) => {
              let compColor = '#94a3b8';
              if (avgCompliance >= 80) compColor = '#10b981';
              else if (avgCompliance >= 60) compColor = '#6366f1';
              else if (avgCompliance >= 40) compColor = '#f59e0b';
              else if (clientCount > 0) compColor = '#ef4444';

              return (
                <div key={practitioner.id} className="team-member-card card">
                  <div className="team-member-header">
                    <div className="team-member-avatar">{practitioner.full_name[0]}</div>
                    <div>
                      <h4>{practitioner.full_name}</h4>
                      <span className="team-member-code">Code: {practitioner.login_code}</span>
                    </div>
                  </div>
                  <div className="team-member-stats">
                    <div className="team-stat">
                      <span className="team-stat-value">{clientCount}</span>
                      <span className="team-stat-label">Clients</span>
                    </div>
                    <div className="team-stat">
                      <span className="team-stat-value">{totalCheckIns}</span>
                      <span className="team-stat-label">Check-ins</span>
                    </div>
                    <div className="team-stat">
                      <span className="team-stat-value" style={{ color: compColor }}>{clientCount > 0 ? avgCompliance : '—'}</span>
                      <span className="team-stat-label">Avg Compliance</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <h3>Client Overview</h3>
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

          {rows.length === 0 && (
            <div className="empty-state">
              <p>No clients yet. Add your first client to get started.</p>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="dashboard-section" style={{ marginTop: 32 }}>
          <h3>Device Analytics</h3>
          {deviceAnalytics.total === 0 ? (
            <div className="empty-state">
              <p>No device data yet. Analytics will appear as clients use the app.</p>
            </div>
          ) : (
            <>
              <div className="device-analytics-grid">
                {deviceAnalytics.deviceBreakdown.map(({ device, count, percentage }) => {
                  const config: Record<string, { icon: React.ReactNode; label: string; bg: string; color: string }> = {
                    iphone: { icon: <Smartphone size={20} />, label: 'iPhone', bg: '#eef2ff', color: '#6366f1' },
                    ipad: { icon: <Tablet size={20} />, label: 'iPad', bg: '#fce7f3', color: '#db2777' },
                    mac: { icon: <Monitor size={20} />, label: 'Mac', bg: '#f0fdf4', color: '#16a34a' },
                    android: { icon: <Smartphone size={20} />, label: 'Android', bg: '#d1fae5', color: '#059669' },
                    windows: { icon: <Monitor size={20} />, label: 'Windows', bg: '#f0f9ff', color: '#0284c7' },
                    other: { icon: <Monitor size={20} />, label: 'Other', bg: '#f1f5f9', color: '#64748b' },
                  };
                  const c = config[device] || config.other;
                  return (
                    <div key={device} className="device-stat-card">
                      <div className="device-stat-icon" style={{ background: c.bg, color: c.color }}>
                        {c.icon}
                      </div>
                      <div className="device-stat-info">
                        <span className="device-stat-label">{c.label}</span>
                        <span className="device-stat-value">{count} <span className="device-stat-pct">({percentage}%)</span></span>
                      </div>
                      <div className="device-stat-bar-wrap">
                        <div className="device-stat-bar" style={{ width: `${percentage}%`, background: c.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="device-total-label">{deviceAnalytics.total} total visit{deviceAnalytics.total !== 1 ? 's' : ''} tracked</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
