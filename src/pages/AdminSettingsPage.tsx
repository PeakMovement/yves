import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivePractitioner } from '../hooks/usePractitioner';
import { getWebhookUrl, setWebhookUrl } from '../lib/email';
import { Settings, Link, Save, Check, ChevronRight } from 'lucide-react';

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const currentPractitioner = useActivePractitioner();
  const [webhookUrl, setWebhookUrlState] = useState(getWebhookUrl());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentPractitioner && !currentPractitioner.is_admin) {
      navigate('/admin');
    }
  }, [currentPractitioner]);

  function handleSave() {
    setWebhookUrl(webhookUrl.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="admin-clients-page">
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={22} style={{ color: 'var(--primary)' }} />
          <h2>Settings</h2>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Link size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Webhook</h3>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            Connect a Make.com, Zapier, or custom webhook to send welcome emails to new clients.
            The app will POST <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, fontSize: 13 }}>client_name</code>,{' '}
            <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, fontSize: 13 }}>client_email</code>,{' '}
            <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, fontSize: 13 }}>login_code</code>, and{' '}
            <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, fontSize: 13 }}>app_url</code>.
          </p>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Webhook URL
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="url"
              className="form-input"
              placeholder="https://hook.make.com/..."
              value={webhookUrl}
              onChange={e => setWebhookUrlState(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className={`btn ${saved ? 'btn-ghost' : 'btn-primary'}`}
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              {saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save</>}
            </button>
          </div>
          {webhookUrl && (
            <p style={{ fontSize: 12, color: '#10b981', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={12} /> Webhook configured
            </p>
          )}
          {!webhookUrl && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              No webhook set. Welcome emails will not be sent until you add one.
            </p>
          )}
        </div>

        <div className="card" style={{ opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Integrations</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                Additional integrations coming soon — SMS notifications, EHR sync, and more.
              </p>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

      </div>
    </div>
  );
}
