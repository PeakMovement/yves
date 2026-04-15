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
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getPractitioners();
        console.log('Loaded practitioners:', list);
        setPractitioners(list);
      } catch (err) {
        console.error('Error loading practitioners:', err);
        setError('Failed to load practitioners');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmedCode = loginCode.trim();
    console.log('Login attempt with code:', trimmedCode);
    console.log('Available practitioners:', practitioners);

    const codeError = validateLoginCode(trimmedCode);
    if (codeError) {
      setError(codeError.message);
      return;
    }

    setAuthenticating(true);
    const practitioner = practitioners.find((p) => p.login_code === trimmedCode);
    console.log('Matched practitioner:', practitioner);
    setAuthenticating(false);

    if (!practitioner) {
      setError('Incorrect login code');
      return;
    }

    console.log('Logging in practitioner:', practitioner.id);
    loginPractitioner(practitioner.id);
    console.log('Navigating to /admin');
    navigate('/admin');
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
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
          <input
            type="text"
            className="code-input"
            placeholder="ENTER YOUR 4-DIGIT CODE"
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
