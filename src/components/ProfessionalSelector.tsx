import { useState, useEffect } from 'react';
import { getPractitioners, updateClient, getClient } from '../lib/store';
import type { Client, Practitioner } from '../types/database';
import { User, AlertCircle } from 'lucide-react';

interface ProfessionalSelectorProps {
  client: Client;
  onUpdate?: (updatedClient: Client) => void;
}

export default function ProfessionalSelector({ client, onUpdate }: ProfessionalSelectorProps) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [currentClient, setCurrentClient] = useState<Client>(client);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load practitioners on mount
  useEffect(() => {
    (async () => {
      try {
        console.log('Loading practitioners...');
        const list = await getPractitioners();
        console.log('Practitioners loaded:', list);
        setPractitioners(list || []);
      } catch (err) {
        console.error('Error loading practitioners:', err);
        setError('Failed to load practitioners');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Update when client prop changes
  useEffect(() => {
    setCurrentClient(client);
  }, [client]);

  const handleSelectPractitioner = async (practitionerId: string) => {
    if (!practitionerId) return;

    setUpdating(true);
    setError('');
    setSuccess(false);

    try {
      console.log('Updating client', currentClient.id, 'with practitioner', practitionerId);
      const updated = await updateClient(currentClient.id, { practitioner_id: practitionerId });

      if (updated) {
        console.log('Update successful:', updated);
        setCurrentClient(updated);
        setSuccess(true);
        onUpdate?.(updated);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to save. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const currentProfessional = practitioners.find(p => p.id === currentClient.practitioner_id);

  if (loading) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: !currentProfessional ? '#fef2f2' : 'var(--surface)',
      border: `1px solid ${!currentProfessional ? '#fecaca' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <User size={16} style={{ color: !currentProfessional ? '#dc2626' : '#6366f1' }} />
        <label style={{
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)',
          margin: 0
        }}>
          Assigned Professional
        </label>
        {currentProfessional && (
          <span style={{
            fontSize: '13px',
            color: '#6366f1',
            fontWeight: '600',
            marginLeft: 'auto'
          }}>
            {currentProfessional.name}
          </span>
        )}
      </div>

      {practitioners.length === 0 ? (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '4px',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '12px', color: '#7f1d1d' }}>
            No professionals in system. Contact support.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {practitioners.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectPractitioner(p.id)}
              disabled={updating}
              style={{
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: p.id === currentClient.practitioner_id ? '#6366f1' : 'var(--bg)',
                color: p.id === currentClient.practitioner_id ? 'white' : 'var(--text)',
                cursor: updating ? 'wait' : 'pointer',
                opacity: updating ? 0.6 : 1,
                fontWeight: p.id === currentClient.practitioner_id ? '600' : '400',
                transition: 'all 150ms',
                textAlign: 'left'
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {!currentProfessional && practitioners.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '4px',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '12px', color: '#7f1d1d' }}>
            Select a professional to enable contact features.
          </span>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#7f1d1d'
        }}>
          Error: {error}
        </div>
      )}

      {success && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#166534'
        }}>
          ✓ Professional updated
        </div>
      )}
    </div>
  );
}
