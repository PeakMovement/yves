import { useState, useEffect, useRef } from 'react';
import { getPractitioners, updateClient } from '../lib/store';
import type { Client, Practitioner } from '../types/database';
import { User, AlertCircle, ChevronDown } from 'lucide-react';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPractitioner = async (practitionerId: string) => {
    if (!practitionerId) {
      setDropdownOpen(false);
      return;
    }

    setDropdownOpen(false);
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
  const displayName = currentProfessional?.name && currentProfessional.name.trim()
    ? currentProfessional.name
    : 'Select professional';

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
          Loading professionals...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: !currentProfessional && practitioners.length > 0 ? '#fef2f2' : 'var(--surface)',
      border: `1px solid ${!currentProfessional && practitioners.length > 0 ? '#fecaca' : 'var(--border)'}`,
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
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => !updating && setDropdownOpen(!dropdownOpen)}
            disabled={updating}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: `1px solid ${!currentProfessional ? '#fca5a5' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg)',
              color: currentProfessional ? 'var(--text)' : 'var(--text-muted)',
              cursor: updating ? 'wait' : 'pointer',
              opacity: updating ? 0.6 : 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 200ms',
              fontWeight: currentProfessional ? '500' : '400'
            }}
          >
            <span>{displayName}</span>
            <ChevronDown size={16} style={{
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms'
            }} />
          </button>

          {dropdownOpen && practitioners.length > 0 && (
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
              {practitioners.map((p) => {
                const isSelected = p.id === currentClient.practitioner_id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPractitioner(p.id)}
                    style={{
                      width: '100%',
                      padding: '12px 12px',
                      fontSize: '14px',
                      fontWeight: isSelected ? '600' : '400',
                      border: 'none',
                      backgroundColor: isSelected ? '#6366f1' : 'transparent',
                      color: isSelected ? 'white' : 'var(--text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 150ms',
                      borderBottom: '1px solid var(--border)',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}
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
