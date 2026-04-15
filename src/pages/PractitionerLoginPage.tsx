import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { getPractitioners } from '../lib/store';
import { loginPractitioner } from '../hooks/usePractitioner';
import { validateLoginCode } from '../lib/validation';
import type { Practitioner } from '../types/database';

export default function PractitionerLoginPage() {
  const navigate = useNavigate();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getPractitioners();
        setPractitioners(list);
        if (list.length > 0) setSelectedName(list[0].name);
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

    if (!selectedName) {
      setError('Please select your name');
      return;
    }

    const codeError = validateLoginCode(loginCode);
    if (codeError) {
      setError(codeError.message);
      return;
    }

    setAuthenticating(true);
    const selected = practitioners.find((p) => p.name === selectedName);
    setAuthenticating(false);

    if (!selected) {
      setError('Practitioner not found');
      return;
    }

    if (selected.login_code !== loginCode) {
      setError('Incorrect login code');
      return;
    }

    loginPractitioner(selected.id);
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
              Select your name:
            </label>
            <select
              id="practitioner"
              className="form-input"
              value={selectedName}
              onChange={(e) => {
                setSelectedName(e.target.value);
                setError('');
              }}
            >
              {practitioners.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            className="code-input"
            placeholder="ENTER 4-DIGIT CODE"
            value={loginCode}
            onChange={(e) => {
              setLoginCode(e.target.value);
              setError('');
            }}
            autoFocus
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
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
