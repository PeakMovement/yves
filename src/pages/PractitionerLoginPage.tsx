import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { getPractitioners, validatePractitionerPassword } from '../lib/store';
import { loginPractitioner } from '../hooks/usePractitioner';
import type { Practitioner } from '../types/database';

export default function PractitionerLoginPage() {
  const navigate = useNavigate();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getPractitioners();
        setPractitioners(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch (err) {
        setError('Failed to load practitioners');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedId) {
      setError('Please select a practitioner');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setAuthenticating(true);
    const selected = practitioners.find((p) => p.id === selectedId);
    setAuthenticating(false);

    if (!selected) {
      setError('Practitioner not found');
      return;
    }

    if (!validatePractitionerPassword(selected, password)) {
      setError('Incorrect password');
      return;
    }

    loginPractitioner(selectedId);
    navigate('/admin');
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (practitioners.length === 0) {
    return (
      <div className="client-login">
        <button className="btn btn-ghost back-link" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="login-card">
          <div className="login-icon">
            <Lock size={32} />
          </div>
          <h2>Practitioner Access</h2>
          <p>No practitioners found. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-login">
      <button className="btn btn-ghost back-link" onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="login-card">
        <div className="login-icon">
          <Lock size={32} />
        </div>
        <h2>Practitioner Portal</h2>
        <p>Log in to access the admin dashboard.</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="practitioner" className="form-label">
              Select practitioner:
            </label>
            <select
              id="practitioner"
              className="form-input"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
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

          <input
            type="password"
            className="code-input"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-btn" disabled={authenticating}>
            {authenticating ? 'Authenticating...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
