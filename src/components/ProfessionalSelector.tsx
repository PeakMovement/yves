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
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await getPractitioners();
        console.log('✓ Practitioners loaded:', list.length, list);
        if (list && list.length > 0) {
          setPractitioners(list);
          setLoadError('');
        } else {
          setLoadError('No practitioners found');
          setPractitioners([]);
        }
      } catch (err) {
        console.error('✗ Failed to load practitioners:', err);
        setLoadError('Failed to load practitioners');
        setPractitioners([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSelect(newId: string) {
    if (!newId) {
      setDropdownOpen(false);
      return;
    }

    setDropdownOpen(false);
    setUpdating(true);
    setError('');
    setSuccess(false);

    try {
      console.log('Updating client', client.id, 'with practitioner', newId);
      const updated = await updateClient(client.id, { practitioner_id: newId });

      if (updated) {
        console.log('✓ Client updated successfully:', updated);
        setSelectedId(newId);
        setSuccess(true);
        onUpdate?.(updated);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        console.error('Update returned falsy');
        setError('Failed to update. Please try again.');
      }
    } catch (err) {
      console.error('✗ Error updating professional:', err);
      setError(err instanceof Error ? err.message : 'Error updating assignment');
    } finally {
      setUpdating(false);
    }
  }

  const currentProfessional = practitioners.find(p => p.id === selectedId);
  const isUnassigned = selectedId && !currentProfessional && practitioners.length > 0;

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
        Loading professionals...
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
          Assigned Professional {currentProfessional && `• ${currentProfessional.name}`}
        </label>
        {loadError && (
          <span style={{ fontSize: '12px', color: '#dc2626', marginLeft: 'auto' }}>
            {loadError}
          </span>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 100 }}>
        <button
          onClick={() => !updating && setDropdownOpen(!dropdownOpen)}
          disabled={updating || practitioners.length === 0}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            border: `1px solid ${isUnassigned ? '#fca5a5' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg)',
            color: currentProfessional ? 'var(--text)' : 'var(--text-muted)',
            cursor: updating || practitioners.length === 0 ? 'not-allowed' : 'pointer',
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

        {dropdownOpen && !updating && practitioners.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
            minWidth: '100%'
          }}>
            {practitioners && practitioners.length > 0 ? (
              practitioners.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    console.log('Selected practitioner:', p.id, p.name);
                    handleSelect(p.id);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 12px',
                    fontSize: '14px',
                    fontWeight: p.id === selectedId ? '600' : '400',
                    border: 'none',
                    backgroundColor: p.id === selectedId ? '#6366f1' : 'transparent',
                    color: p.id === selectedId ? 'white' : 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 150ms',
                    borderBottom: '1px solid var(--border)',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    if (p.id !== selectedId) {
                      const btn = e.currentTarget as HTMLButtonElement;
                      btn.style.backgroundColor = 'var(--surface)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (p.id !== selectedId) {
                      const btn = e.currentTarget as HTMLButtonElement;
                      btn.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {p.name}
                </button>
              ))
            ) : (
              <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No practitioners available
              </div>
            )}
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
