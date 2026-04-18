import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPractitioners, getClients, getCheckIns, hasCheckedInToday } from '../lib/store';
import { useActivePractitioner } from '../hooks/usePractitioner';
import type { Practitioner, Client, CheckIn } from '../types/database';
import { formatDate } from '../lib/utils';
import { Users, ChevronDown, ChevronRight, CheckCircle, AlertCircle, AlertTriangle, ArrowRight, Stethoscope } from 'lucide-react';

interface ClientRow {
  client: Client;
  checkIns: CheckIn[];
  done: boolean;
}

interface PractitionerRow {
  practitioner: Practitioner;
  clients: ClientRow[];
}

export default function AdminPractitionersPage() {
  const navigate = useNavigate();
  const currentPractitioner = useActivePractitioner();
  const [rows, setRows] = useState<PractitionerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentPractitioner && !currentPractitioner.is_admin) {
      navigate('/admin');
      return;
    }
    (async () => {
      const practitioners = await getPractitioners();
      const allClients = await getClients();

      const result: PractitionerRow[] = [];
      for (const p of practitioners) {
        const pClients = allClients.filter(c => c.practitioner_id === p.id);
        const clientRows: ClientRow[] = [];
        for (const client of pClients) {
          const checkIns = await getCheckIns(client.id);
          const done = await hasCheckedInToday(client.id);
          clientRows.push({ client, checkIns, done });
        }
        result.push({ practitioner: p, clients: clientRows });
      }
      setRows(result);
      setLoading(false);
    })();
  }, [currentPractitioner]);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) return <div className="page-loading">Loading practitioners...</div>;

  return (
    <div className="admin-clients-page">
      <div className="admin-page-header">
        <h2>Practitioners</h2>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{rows.length} practitioner{rows.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map(({ practitioner, clients }) => {
          const isOpen = expanded.has(practitioner.id);
          const checkedIn = clients.filter(r => r.done).length;
          const flagged = clients.filter(r => r.checkIns[0]?.flagged).length;

          return (
            <div key={practitioner.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => toggleExpand(practitioner.id)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {(practitioner.name || practitioner.full_name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                      {practitioner.name || practitioner.full_name}
                    </span>
                    {practitioner.is_admin && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        padding: '1px 7px',
                        borderRadius: 99,
                      }}>Admin</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={13} /> {clients.length} client{clients.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={13} color="#10b981" /> {checkedIn} checked in
                    </span>
                    {flagged > 0 && (
                      <span style={{ fontSize: 13, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={13} /> {flagged} flagged
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: 12 }}>Code: {practitioner.login_code}</span>
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
                  {clients.length === 0 ? (
                    <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
                      No clients assigned yet.
                    </div>
                  ) : (
                    clients.map(({ client, checkIns, done }) => {
                      const lastCheckIn = checkIns[0];
                      const hasFlagged = lastCheckIn?.flagged;
                      return (
                        <div
                          key={client.id}
                          className={`admin-client-row ${hasFlagged ? 'flagged-row' : ''}`}
                          onClick={() => navigate(`/admin/clients/${client.id}`)}
                          style={{ margin: '0 8px', borderRadius: 'var(--radius-sm)' }}
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
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="empty-state">
            <Stethoscope size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <p>No practitioners found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
