import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { useActivePractitioner } from '../hooks/usePractitioner';
import { updatePractitionerPassword, validatePractitionerPassword } from '../lib/store';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const practitioner = useActivePractitioner();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!practitioner) {
    return <div className="page-loading">Loading...</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!practitioner) {
      setError('Not authenticated');
      return;
    }

    if (!currentPassword.trim()) {
      setError('Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      if (!validatePractitionerPassword(practitioner, currentPassword)) {
        setError('Current password is incorrect');
        setLoading(false);
        return;
      }

      await updatePractitionerPassword(practitioner.id, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Show success message and redirect after 2 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="client-login">
      <button className="btn btn-ghost back-link" onClick={() => navigate('/admin')}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="login-card">
        <div className="login-icon">
          <KeyRound size={32} />
        </div>
        <h2>Change Password</h2>
        <p>Update your practitioner account password.</p>

        {success && (
          <div className="success-message">
            Password updated successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="code-input"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setError('');
            }}
            autoComplete="current-password"
            disabled={loading}
          />

          <input
            type="password"
            className="code-input"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError('');
            }}
            autoComplete="new-password"
            disabled={loading}
          />

          <input
            type="password"
            className="code-input"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            autoComplete="new-password"
            disabled={loading}
          />

          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
