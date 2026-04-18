import { useState, useEffect } from 'react';
import { CircleAlert as AlertCircle, Send, UserCheck, ChevronRight, Check } from 'lucide-react';
import { storeSymptomQuery, createContactRequest, getPractitionerDisplayName } from '../lib/store';
import { analyzeSymptomLocal } from '../lib/symptomAnalysis';
import { getLoggedInClientId } from '../hooks/useClient';
import { useClientContext } from '../context/ClientContext';

const EXAMPLE_PROMPTS = [
  'I have sharp pain in my lower back when I bend forward',
  'My neck feels stiff and painful after sleeping',
  'I experience tingling in my hands during the day',
  'My shoulder hurts when I lift my arm overhead',
  'I have constant dull ache in my right knee',
];

export default function QueryPage() {
  const clientId = getLoggedInClientId();
  const { client, practitioners, assignedPractitioner, selectPractitioner } = useClientContext();
  const [prompt, setPrompt] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [contacting, setContacting] = useState(false);
  const [contacted, setContacted] = useState(false);
  const [selectingPractitioner, setSelectingPractitioner] = useState(false);
  const [savingPractitioner, setSavingPractitioner] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  async function handleSelectPractitioner(practitionerId: string) {
    setSavingPractitioner(true);
    setError('');
    try {
      await selectPractitioner(practitionerId);
      setTimeout(() => {
        setSelectingPractitioner(false);
        setSavingPractitioner(false);
      }, 800);
    } catch (err) {
      setError('Could not save your selection. Please try again.');
      setSavingPractitioner(false);
    }
  }

  async function handleContactProfessional() {
    if (!clientId) {
      setError('Unable to identify you. Please refresh and try again.');
      return;
    }
    if (!client) {
      setError('Loading your profile... please try again in a moment.');
      return;
    }
    if (!client.practitioner_id) {
      setError('No assigned professional found in your profile');
      return;
    }
    setContacting(true);
    setError('');
    try {
      await createContactRequest(
        clientId,
        client.practitioner_id,
        prompt,
        result.matched_score || 0
      );
      setContacted(true);
    } catch (err) {
      setError('Failed to send notification. Please try again.');
    } finally {
      setContacting(false);
    }
  }

  async function handleSubmit() {
    if (!prompt.trim()) {
      setError('Please describe your symptoms');
      return;
    }
    if (!clientId) {
      setError('Unable to identify user');
      return;
    }
    setError('');
    setAnalyzing(true);
    try {
      const analysisResult = analyzeSymptomLocal(prompt);
      storeSymptomQuery(clientId, prompt, analysisResult.red_flag_detected, analysisResult.confidence_score);
      setResult(analysisResult);
    } catch (err) {
      setError('Failed to analyze symptoms. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  const assignedName = assignedPractitioner ? getPractitionerDisplayName(assignedPractitioner) : null;

  if (selectingPractitioner) {
    return (
      <div className="checkin-page">
        <div className="checkin-card">
          <div className="step-content">
            <h2 style={{ marginBottom: '6px' }}>Select Your Professional</h2>
            <p className="subtext" style={{ marginBottom: '24px' }}>
              Choose the practitioner who is managing your care
            </p>

            {practitioners.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '14px' }}>
                No professionals found. Please contact your clinic.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {practitioners.map((p) => {
                  const isSelected = client?.practitioner_id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPractitioner(p.id)}
                      disabled={savingPractitioner}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        background: isSelected ? 'var(--primary)' : 'var(--surface)',
                        color: isSelected ? '#fff' : 'var(--text)',
                        border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: savingPractitioner ? 'default' : 'pointer',
                        fontSize: '15px',
                        fontWeight: isSelected ? '600' : '400',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                        opacity: savingPractitioner && !isSelected ? 0.5 : 1,
                        width: '100%',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserCheck size={18} style={{ flexShrink: 0, opacity: 0.7 }} />
                        {getPractitionerDisplayName(p)}
                      </span>
                      {isSelected ? (
                        <Check size={16} />
                      ) : (
                        <ChevronRight size={16} style={{ opacity: 0.4 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 'var(--radius-sm)',
                color: '#c2410c',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-ghost"
              style={{ width: '100%' }}
              onClick={() => { setSelectingPractitioner(false); setError(''); }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="checkin-page">
        <div className="checkin-card">
          <div className="step-content">
            {result.red_flag_detected ? (
              <div style={{
                display: 'flex',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '20px',
                alignItems: 'flex-start',
              }}>
                <AlertCircle size={24} style={{ color: '#c2410c', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ color: '#c2410c', marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>
                    Medical Referral Recommended
                  </h3>
                  <p style={{ color: '#92400e', fontSize: '14px', lineHeight: '1.5', marginBottom: '8px' }}>
                    {result.suggested_next_step}
                  </p>
                  {result.matched_symptom && (
                    <p style={{ color: '#92400e', fontSize: '12px' }}>
                      <strong>Matched:</strong> {result.matched_symptom} (Score: {result.matched_score}/10)
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '20px',
              }}>
                <div>
                  <h3 style={{ color: '#166534', marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>
                    Monitoring Recommended
                  </h3>
                  <p style={{ color: '#166534', fontSize: '14px', lineHeight: '1.5', marginBottom: '8px' }}>
                    {result.suggested_next_step}
                  </p>
                  {result.matched_symptom && (
                    <p style={{ color: '#166534', fontSize: '12px' }}>
                      <strong>Matched:</strong> {result.matched_symptom} (Score: {result.matched_score}/10)
                    </p>
                  )}
                </div>
              </div>
            )}

            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '13px',
            }}>
              <p style={{ marginBottom: '4px', color: 'var(--text-secondary)' }}>
                <strong>Your symptoms:</strong>
              </p>
              <p style={{ color: 'var(--text)', fontStyle: 'italic' }}>{prompt}</p>
            </div>

            <div className="step-actions" style={{ flexDirection: 'column', gap: '12px' }}>
              {result.red_flag_detected && !contacted && (
                <>
                  {!client?.practitioner_id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontSize: '13px', color: '#92400e', textAlign: 'center' }}>
                        No professional assigned yet. Select one to send a notification.
                      </p>
                      <button
                        className="btn btn-primary"
                        style={{ backgroundColor: '#c2410c' }}
                        onClick={() => setSelectingPractitioner(true)}
                      >
                        <UserCheck size={16} />
                        Select a Professional
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, backgroundColor: '#c2410c' }}
                      onClick={handleContactProfessional}
                      disabled={contacting}
                    >
                      <Send size={16} />
                      {contacting ? 'Sending...' : `Contact ${assignedName ?? 'My Professional'}`}
                    </button>
                  )}
                </>
              )}

              {contacted && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                  color: '#166534',
                  fontSize: '13px',
                  fontWeight: '500',
                }}>
                  Notification sent to {assignedName ?? 'your professional'}
                </div>
              )}

              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 'var(--radius-sm)',
                  color: '#c2410c',
                  fontSize: '13px',
                }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => { setResult(null); setPrompt(''); setContacted(false); setError(''); }}
              >
                Ask Another Question
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-page">
      <div className="checkin-card">
        <div className="step-content">
          <h2>What symptoms are you feeling?</h2>
          <p className="subtext">Describe any pain, discomfort, or symptoms you're experiencing</p>

          {client && (
            <div
              onClick={() => setSelectingPractitioner(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                marginBottom: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '13px',
                color: client.practitioner_id ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={15} style={{ opacity: 0.6 }} />
                {client.practitioner_id
                  ? <>My professional: <strong style={{ marginLeft: '4px' }}>{assignedName ?? 'Loading...'}</strong></>
                  : 'No professional selected — tap to assign one'}
              </span>
              <ChevronRight size={14} style={{ opacity: 0.4 }} />
            </div>
          )}

          <textarea
            className="notes-input"
            placeholder="Type your symptoms here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            style={{ marginBottom: '16px' }}
          />

          <div style={{
            padding: '12px',
            backgroundColor: 'var(--bg)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <em>{EXAMPLE_PROMPTS[exampleIndex]}</em>
          </div>

          {error && <p className="login-error" style={{ marginTop: '12px' }}>{error}</p>}

          <div className="step-actions">
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleSubmit}
              disabled={analyzing}
            >
              {analyzing ? 'Analyzing...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
