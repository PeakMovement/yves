import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { getPractitioners } from '../lib/store';
import { loginPractitioner } from '../hooks/usePractitioner';
import type { Practitioner } from '../types/database';

export default function PractitionerLoginPage() {
  const navigate = useNavigate();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getPractitioners();
        setPractitioners(list);
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

    if (!code.trim()) {
      setError('Please enter your practitioner code');
      return;
    }

    setAuthenticating(true);
    const selected = practitioners.find((p) => p.login_code === code);
    setAuthenticating(false);

    if (!selected) {
      setError('Invalid practitioner code');
      return;
    }

    loginPractitioner(selected.id);
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
            placeholder="Practitioner Code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
            autoFocus
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
