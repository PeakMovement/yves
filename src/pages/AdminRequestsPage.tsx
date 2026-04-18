import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivePractitioner } from '../hooks/usePractitioner';
import { supabase } from '../lib/supabase';
import { MessageSquare, Check, RefreshCw, Filter } from 'lucide-react';

interface ContactRequest {
  id: string;
  client_id: string;
  practitioner_id: string;
  client_full_name?: string;
  practitioner_name?: string;
  symptom_description: string;
  symptom_score: number;
  is_read: boolean;
  created_at: string;
  responded_at?: string;
}

export default function AdminRequestsPage() {
  const navigate = useNavigate();
  const currentPractitioner = useActivePractitioner();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [filter, setFilter] = useState<'unread' | 'all'>('unread');

  useEffect(() => {
    if (currentPractitioner && !currentPractitioner.is_admin) {
      navigate('/admin');
    }
  }, [currentPractitioner]);

  const loadRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .select(`
          id,
          client_id,
          practitioner_id,
          symptom_description,
          symptom_score,
          is_read,
          created_at,
          responded_at,
          clients(full_name),
          practitioners(name)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map((req: any) => ({
          id: req.id,
          client_id: req.client_id,
          practitioner_id: req.practitioner_id,
          client_full_name: req.clients?.full_name,
          practitioner_name: req.practitioners?.name,
          symptom_description: req.symptom_description,
          symptom_score: req.symptom_score,
          is_read: req.is_read,
          created_at: req.created_at,
          responded_at: req.responded_at,
        }));
        setRequests(mapped);
      }
    } catch (err) {
      console.error('Failed to load contact requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 10000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  async function markAsRead(requestId: string) {
    setMarking(requestId);
    try {
      await supabase
        .from('contact_requests')
        .update({ is_read: true, responded_at: new Date().toISOString() })
        .eq('id', requestId);
      setRequests(prev =>
        prev.map(r => r.id === requestId ? { ...r, is_read: true, responded_at: new Date().toISOString() } : r)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    } finally {
      setMarking(null);
    }
  }

  const displayed = filter === 'unread' ? requests.filter(r => !r.is_read) : requests;
  const unreadCount = requests.filter(r => !r.is_read).length;

  if (loading) return <div className="page-loading">Loading requests...</div>;

  return (
    <div className="admin-clients-page">
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2>Contact Requests</h2>
          {unreadCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              fontSize: 12,
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: 99,
            }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('unread')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Filter size={14} /> Unread
          </button>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button className="btn btn-ghost btn-sm" onClick={loadRequests} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p>{filter === 'unread' ? 'No unread contact requests.' : 'No contact requests yet.'}</p>
          {filter === 'unread' && requests.length > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setFilter('all')}>
              View all {requests.length} request{requests.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayed.map(request => (
            <div
              key={request.id}
              style={{
                padding: '16px 20px',
                background: request.is_read ? 'var(--surface)' : '#fff7ed',
                border: `1px solid ${request.is_read ? 'var(--border)' : '#fed7aa'}`,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    {request.client_full_name || 'Unknown client'}
                  </span>
                  {!request.is_read && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: '#fef3c7',
                      color: '#b45309',
                      padding: '1px 7px',
                      borderRadius: 99,
                    }}>Unread</span>
                  )}
                </div>
                {request.practitioner_name && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Practitioner: {request.practitioner_name}
                  </div>
                )}
                <div style={{
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}>
                  "{request.symptom_description}"
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                  <span>Score: {request.symptom_score}/10</span>
                  <span>{new Date(request.created_at).toLocaleDateString()} {new Date(request.created_at).toLocaleTimeString()}</span>
                  {request.responded_at && (
                    <span>Responded: {new Date(request.responded_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {!request.is_read ? (
                  <button
                    onClick={() => markAsRead(request.id)}
                    disabled={marking === request.id}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Check size={14} />
                    {marking === request.id ? 'Marking...' : 'Mark read'}
                  </button>
                ) : (
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    padding: '6px 10px',
                    background: 'var(--bg)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <Check size={12} /> Responded
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
