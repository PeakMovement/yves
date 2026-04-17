import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { createClient, createSymptom, getPractitioners } from '../lib/store';
import { loginClient } from '../hooks/useClient';
import { validateClientName, validateLoginCode } from '../lib/validation';
import type { Practitioner } from '../types/database';

export default function ClientRegistrationPage() {
  const navigate = useNavigate();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    login_code: '',
    practitioner_id: '',
    symptoms: '',
    checkin_frequency: 1,
  });

  useEffect(() => {
    (async () => {
      try {
        const list = await getPractitioners();
        const visible = list.filter((p) => p.name && p.name.toLowerCase() !== 'admin');
        setPractitioners(visible);
      } catch (err) {
        console.error('Failed to load practitioners:', err);
        setError('Failed to load practitioners. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate full name
    const nameError = validateClientName(formData.full_name);
    if (nameError) {
      setError(nameError.message);
      return;
    }

    // Validate login code
    const codeError = validateLoginCode(formData.login_code);
    if (codeError) {
      setError(codeError.message);
      return;
    }

    // Validate practitioner selected
    if (!formData.practitioner_id) {
      setError('Please select your practitioner');
      return;
    }

    setCreating(true);

    try {
      // Create the client
      const client = await createClient({
        full_name: formData.full_name.trim(),
        email: '', // Email not required for self-registration
        practitioner_id: formData.practitioner_id,
        next_appointment: null,
        primary_complaint: '',
        notes: null,
        tracking_duration_weeks: null,
        custom_login_code: formData.login_code.trim(),
      });

      // Add symptoms if provided
      if (formData.symptoms.trim()) {
        const symptomNames = formData.symptoms.split(',').map((s) => s.trim()).filter((s) => s);
        for (const symptomName of symptomNames) {
          await createSymptom({
            client_id: client.id,
            name: symptomName,
            body_area: '',
            active: true,
          });
        }
      }

      setSuccess(true);
      loginClient(client.id);

      // Redirect to check-in after successful registration
      setTimeout(() => {
        navigate('/app/checkin');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="client-login">
      <button className="btn btn-ghost back-link" onClick={() => navigate('/app/login')}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="login-card">
        <div className="login-icon">
          <UserPlus size={32} />
        </div>
        <h2>Create Your Profile</h2>
        <p>Set up your check-in portal in seconds.</p>

        {success && (
          <div className="success-message">
            ✓ Profile created successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-input"
            placeholder="Full name"
            value={formData.full_name}
            onChange={(e) => {
              setFormData({ ...formData, full_name: e.target.value });
              setError('');
            }}
            autoFocus
            disabled={creating}
          />

          <input
            type="text"
            className="code-input"
            placeholder="CHOOSE A 4-DIGIT CODE"
            value={formData.login_code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setFormData({ ...formData, login_code: val });
              setError('');
            }}
            maxLength={4}
            inputMode="numeric"
            disabled={creating}
          />

          <div>
            <label htmlFor="practitioner" className="form-label">
              Who is your practitioner?
            </label>
            <select
              id="practitioner"
              className="form-input"
              value={formData.practitioner_id}
              onChange={(e) => {
                setFormData({ ...formData, practitioner_id: e.target.value });
                setError('');
              }}
              disabled={creating || practitioners.length === 0}
            >
              <option value="">Select your practitioner</option>
              {practitioners.length === 0 ? (
                <option disabled>No practitioners available</option>
              ) : (
                practitioners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="form-label">How often would you like to check in?</label>
            <div className="schedule-buttons">
              {[
                { value: 1, label: 'Every day' },
                { value: 2, label: 'Every 2 days' },
                { value: 3, label: 'Every 3 days' },
                { value: 7, label: 'Once a week' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`schedule-btn ${formData.checkin_frequency === option.value ? 'selected' : ''}`}
                  onClick={() => {
                    setFormData({ ...formData, checkin_frequency: option.value });
                    setError('');
                  }}
                  disabled={creating}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            className="form-input"
            placeholder="Symptoms to track (comma-separated, optional)"
            value={formData.symptoms}
            onChange={(e) => {
              setFormData({ ...formData, symptoms: e.target.value });
              setError('');
            }}
            disabled={creating}
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn-primary login-btn" disabled={creating || practitioners.length === 0}>
            {creating ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
