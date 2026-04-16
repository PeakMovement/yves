import { useState, useEffect } from 'react';
import { getPractitioners, updateClient } from '../lib/store';
import type { Client, Practitioner } from '../types/database';
import { User, AlertCircle } from 'lucide-react';

interface ProfessionalSelectorProps {
  client: Client;
  onUpdate?: (updatedClient: Client) => void;
}

export default function ProfessionalSelector({ client, onUpdate }: ProfessionalSelectorProps) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedId, setSelectedId] = useState(client.practitioner_id);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getPractitioners();
        setPractitioners(list);
      } catch (err) {
        setError('Failed to load practitioners');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value;
    setSelectedId(newId);
    setUpdating(true);
    setError('');
    setSuccess(false);

    try {
      const updated = await updateClient(client.id, { practitioner_id: newId });
      if (updated) {
        setSuccess(true);
        onUpdate?.(updated);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to update professional assignment');
      }
    } catch (err) {
      setError('Error updating professional assignment');
      console.error(err);
      setSelectedId(client.practitioner_id);
    } finally {
      setUpdating(false);
    }
  }

  const currentProfessional = practitioners.find(p => p.id === client.practitioner_id);
  const isUnassigned = !currentProfessional;

  return (
    <div style={{
      padding: '16px',
      backgroundColor: isUnassigned ? '#fef2f2' : 'var(--surface)',
      border: `1px solid ${isUnassigned ? '#fecaca' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <User size={16} style={{ color: isUnassigned ? '#dc2626' : 'var(--text-secondary)' }} />
        <label style={{
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)',
          margin: 0
        }}>
          Assigned Professional
        </label>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>
      ) : (
        <>
          <select
            value={selectedId}
            onChange={handleChange}
            disabled={updating || practitioners.length === 0}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: `1px solid ${isUnassigned ? '#fca5a5' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              cursor: updating ? 'wait' : 'pointer',
              opacity: updating ? 0.6 : 1,
              transition: 'all 200ms'
            }}
          >
            {practitioners.length === 0 ? (
              <option>No professionals available</option>
            ) : (
              <>
                <option value="">Select a professional</option>
                {practitioners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </>
            )}
          </select>

          {isUnassigned && (
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
                No professional assigned. Please select one to enable contact features.
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
              {error}
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
              ✓ Professional assignment updated
            </div>
          )}
        </>
      )}
    </div>
  );
}
