import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientByLoginCode, trackDeviceVisit, getPractitioners } from '../lib/store';
import { loginClient } from '../hooks/useClient';
import { KeyRound, ArrowLeft } from 'lucide-react';
import type { Practitioner } from '../types/database';

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPractitioners, setLoadingPractitioners] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await getPractitioners();
        setPractitioners(list);
        if (list.length > 0) setSelectedPractitioner(list[0].id);
      } catch (err) {
        console.error('Failed to load practitioners:', err);
      } finally {
        setLoadingPractitioners(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter your login code.');
      return;
    }

    setLoading(true);
    const client = await getClientByLoginCode(trimmed);
    setLoading(false);

    if (!client) {
      setError('Code not recognised. Please check and try again.');
      return;
    }

    loginClient(client.id);
    trackDeviceVisit(client.id, 'login');
    navigate('/app/checkin');
  }

  return (
    <div className="client-login">
      <button className="btn btn-ghost back-link" onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="login-card">
        <div className="login-icon">
          <KeyRound size={32} />
        </div>
        <h2>Welcome to Buddy</h2>
        <p>Enter the login code your practitioner gave you to access your check-in portal.</p>

        <form onSubmit={handleSubmit}>
          {!loadingPractitioners && practitioners.length > 0 && (
            <div>
              <label htmlFor="practitioner" className="form-label">
                Select your practitioner:
              </label>
              <select
                id="practitioner"
                className="form-input"
                value={selectedPractitioner}
                onChange={(e) => {
                  setSelectedPractitioner(e.target.value);
                  setError('');
                }}
              >
                {practitioners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <input
            type="text"
            className="code-input"
            placeholder="e.g. 1234"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
            maxLength={4}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            inputMode="numeric"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Checking...' : 'Log in'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
          <p style={{ marginBottom: '12px', color: '#6b7280', fontSize: '14px' }}>
            Don't have a login code?
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/app/register')}
            style={{ width: '100%' }}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
