import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientByLoginCode, trackDeviceVisit } from '../lib/store';
import { loginClient } from '../hooks/useClient';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter your login code.');
      return;
    }

    const client = getClientByLoginCode(trimmed);
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
          <input
            type="text"
            className="code-input"
            placeholder="e.g. A3K7X2"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            maxLength={6}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-btn">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
