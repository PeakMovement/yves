import { useEffect, useState } from 'react';
import { MessageCircle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ContactRequest {
  id: string;
  client_id: string;
  client_full_name?: string;
  symptom_description: string;
  symptom_score: number;
  is_read: boolean;
  created_at: string;
}

export default function ContactRequestsPanel({ practitionerId }: { practitionerId: string }) {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
    // Poll for new requests every 5 seconds
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, [practitionerId]);

  async function loadRequests() {
    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .select(
          `
          id,
          client_id,
          symptom_description,
          symptom_score,
          is_read,
          created_at,
          clients(full_name)
        `
        )
        .eq('practitioner_id', practitionerId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map((req: any) => ({
          id: req.id,
          client_id: req.client_id,
          client_full_name: req.clients?.full_name,
          symptom_description: req.symptom_description,
          symptom_score: req.symptom_score,
          is_read: req.is_read,
          created_at: req.created_at,
        }));
        setRequests(mapped);
      }
    } catch (err) {
      console.error('Failed to load contact requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(requestId: string) {
    setMarking(requestId);
    try {
      await supabase
        .from('contact_requests')
        .update({ is_read: true, responded_at: new Date().toISOString() })
        .eq('id', requestId);

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, is_read: true } : req
        )
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    } finally {
      setMarking(null);
    }
  }

  const unreadCount = requests.filter((r) => !r.is_read).length;

  if (loading) {
    return <div className="page-loading">Loading notifications...</div>;
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <MessageCircle size={20} style={{ color: 'var(--primary)' }} />
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--text)',
          margin: 0
        }}>
          Client Contact Requests
        </h3>
        {unreadCount > 0 && (
          <span style={{
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '12px',
            marginLeft: 'auto'
          }}>
            {unreadCount} new
          </span>
        )}
      </div>

      {requests.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '14px',
          backgroundColor: 'var(--bg)',
          borderRadius: 'var(--radius-sm)'
        }}>
          No contact requests yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                padding: '14px',
                backgroundColor: request.is_read ? 'var(--surface)' : '#fff7ed',
                border: `1px solid ${request.is_read ? 'var(--border)' : '#fed7aa'}`,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--text)',
                  marginBottom: '4px'
                }}>
                  {request.client_full_name}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  fontStyle: 'italic'
                }}>
                  "{request.symptom_description}"
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  gap: '16px'
                }}>
                  <span>Score: {request.symptom_score}/10</span>
                  <span>
                    {new Date(request.created_at).toLocaleDateString()} {new Date(request.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              {!request.is_read && (
                <button
                  onClick={() => markAsRead(request.id)}
                  disabled={marking === request.id}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: marking === request.id ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Check size={14} />
                  {marking === request.id ? 'Marking...' : 'Mark read'}
                </button>
              )}
              {request.is_read && (
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  ✓ Responded
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
