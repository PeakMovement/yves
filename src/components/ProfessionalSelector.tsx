import { useState, useEffect } from 'react';
import { getPractitioners, updateClient } from '../lib/store';
import type { Client, Practitioner } from '../types/database';
import { User, AlertCircle, ChevronDown } from 'lucide-react';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getPractitioners();
        setPractitioners(list);
        console.log('Loaded practitioners:', list);
      } catch (err) {
        setError('Failed to load practitioners');
        console.error('Error loading practitioners:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSelect(newId: string) {
    if (!newId || newId === selectedId) {
      setDropdownOpen(false);
      return;
    }

    setSelectedId(newId);
    setDropdownOpen(false);
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
        setSelectedId(client.practitioner_id);
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
  const isUnassigned = !currentProfessional && practitioners.length > 0;

  if (loading) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '16px',
        fontSize: '14px',
        color: 'var(--text-muted)'
      }}>
        Loading professional information...
      </div>
    );
  }

  if (practitioners.length === 0) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '16px',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start'
      }}>
        <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '13px', color: '#7f1d1d' }}>
          No professionals available in the system. Please contact support.
        </span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: isUnassigned ? '#fef2f2' : 'var(--surface)',
      border: `1px solid ${isUnassigned ? '#fecaca' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      marginBottom: '16px',
      position: 'relative'
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
          Assigned Professional {currentProfessional && `(${currentProfessional.name})`}
        </label>
      </div>

      <div style={{ position: 'relative', zIndex: 100 }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={updating}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            border: `1px solid ${isUnassigned ? '#fca5a5' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            cursor: updating ? 'wait' : 'pointer',
            opacity: updating ? 0.6 : 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 200ms'
          }}
        >
          <span>{currentProfessional?.name || 'Select a professional'}</span>
          <ChevronDown size={16} style={{
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms'
          }} />
        </button>

        {dropdownOpen && !updating && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: 'var(--bg)',
            border: `1px solid var(--border)`,
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {practitioners.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: 'none',
                  backgroundColor: p.id === selectedId ? 'var(--primary)' : 'transparent',
                  color: p.id === selectedId ? 'white' : 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 150ms',
                  borderBottom: '1px solid var(--border)'
                }}
                onMouseEnter={(e) => {
                  if (p.id !== selectedId) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'var(--surface)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (p.id !== selectedId) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

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
            No professional assigned. Select one to enable contact features.
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
          ✓ Professional updated
        </div>
      )}
    </div>
  );
}
