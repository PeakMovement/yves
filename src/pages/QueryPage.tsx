import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { storeSymptomQuery } from '../lib/store';
import { analyzeSymptomLocal } from '../lib/symptomAnalysis';
import { getLoggedInClientId } from '../hooks/useClient';

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

  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
                      Attention Needed
                    </h3>
                    <p style={{ color: '#92400e', fontSize: '14px', lineHeight: '1.5' }}>
                      Based on your description, we recommend you {result.suggested_next_step.toLowerCase()}.
                    </p>
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
                      All Good
                    </h3>
                    <p style={{ color: '#166534', fontSize: '14px', lineHeight: '1.5' }}>
                      {result.suggested_next_step}
                    </p>
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

            <div className="step-actions">
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  setResult(null);
                  setPrompt('');
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

