import { useState, useEffect } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { storeSymptomQuery, createContactRequest, getClient } from '../lib/store';
import { analyzeSymptomLocal } from '../lib/symptomAnalysis';
import { getLoggedInClientId } from '../hooks/useClient';
import ProfessionalSelector from '../components/ProfessionalSelector';
import type { Client } from '../types/database';

const EXAMPLE_PROMPTS = [
  'I have sharp pain in my lower back when I bend forward',
  'My neck feels stiff and painful after sleeping',
  'I experience tingling in my hands during the day',
  'My shoulder hurts when I lift my arm overhead',
  'I have constant dull ache in my right knee',
];

export default function QueryPage() {
  const clientId = getLoggedInClientId();
  const [prompt, setPrompt] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [contacting, setContacting] = useState(false);
  const [contacted, setContacted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      if (clientId) {
        try {
          const clientData = await getClient(clientId);
          setClient(clientData || null);
        } catch (err) {
          console.error('Failed to load client profile:', err);
        }
      }
    })();
  }, [clientId]);

  async function handleContactProfessional() {
    console.log('Contact professional clicked', { client, clientId });

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
      console.log('Sending contact request', {
        clientId,
        practitionerId: client.practitioner_id,
        symptom: prompt,
        score: result.matched_score,
      });
      const success = await createContactRequest(
        clientId,
        client.practitioner_id,
        prompt,
        result.matched_score || 0
      );
      if (success) {
        console.log('Contact request sent successfully');
        setContacted(true);
      }
    } catch (err) {
      console.error('Error contacting professional:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to send notification. Please try again.';
      setError(errorMsg);
    } finally {
      setContacting(false);
    }
  }

  async function handleSubmit() {
    console.log('Submit clicked', { prompt: prompt.trim(), clientId });

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
      console.log('Analyzing symptom locally:', { prompt, clientId });
      const analysisResult = analyzeSymptomLocal(prompt);
      console.log('Analysis result:', analysisResult);

      // Store the query for learning (fire and forget)
      storeSymptomQuery(clientId, prompt, analysisResult.red_flag_detected, analysisResult.confidence_score);

      setResult(analysisResult);
    } catch (err) {
      console.error('Error during analysis:', err);
      setError('Failed to analyze symptoms. Please try again.');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  // Show results
  if (result) {
    return (
      <div className="checkin-page">
        <div className="checkin-card">
          <div className="step-content">
            {result.red_flag_detected ? (
              <>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '20px',
                  alignItems: 'flex-start'
                }}>
                  <AlertCircle size={24} style={{ color: '#c2410c', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ color: '#c2410c', marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>
                      ⚠️ Medical Referral Recommended
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
              </>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '20px'
                }}>
                  <div>
                    <h3 style={{ color: '#166534', marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>
                      ✓ Monitoring Recommended
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
              </>
            )}

            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '13px'
            }}>
              <p style={{ marginBottom: '4px', color: 'var(--text-secondary)' }}>
                <strong>Your symptoms:</strong>
              </p>
              <p style={{ color: 'var(--text)', fontStyle: 'italic' }}>{prompt}</p>
            </div>

            <div className="step-actions" style={{ flexDirection: 'column', gap: '12px' }}>
              {result.red_flag_detected && !contacted && (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, backgroundColor: '#c2410c' }}
                  onClick={handleContactProfessional}
                  disabled={contacting || !client}
                  title={!client ? 'Loading professional info...' : ''}
                >
                  <Send size={16} />
                  {contacting ? 'Sending...' : 'Contact My Professional'}
                </button>
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
                  fontWeight: '500'
                }}>
                  ✓ Notification sent to your professional
                </div>
              )}
              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 'var(--radius-sm)',
                  color: '#c2410c',
                  fontSize: '13px'
                }}>
                  {error}
                </div>
              )}
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  setResult(null);
                  setPrompt('');
                  setContacted(false);
                  setError('');
                }}
              >
                Ask Another Question
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show input form
  return (
    <div className="checkin-page">
      {client && (
        <ProfessionalSelector
          client={client}
          onUpdate={(updated) => setClient(updated)}
        />
      )}
      <div className="checkin-card">
        <div className="step-content">
          <h2>What symptoms are you feeling?</h2>
          <p className="subtext">Describe any pain, discomfort, or symptoms you're experiencing</p>

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
            justifyContent: 'center'
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
