import { useState, useEffect } from 'react';

const EXAMPLE_PROMPTS = [
  'I have sharp pain in my lower back when I bend forward',
  'My neck feels stiff and painful after sleeping',
  'I experience tingling in my hands during the day',
  'My shoulder hurts when I lift my arm overhead',
  'I have constant dull ache in my right knee',
];

export default function QueryPage() {
  const [prompt, setPrompt] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

          <div className="step-actions">
            <button className="btn btn-primary" style={{ flex: 1 }}>
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

