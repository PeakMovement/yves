import { useState } from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { ClipboardCheck, MessageCircle, BarChart3, TrendingUp, LogOut, UserCheck, ChevronDown, Check } from 'lucide-react';
import { getLoggedInClientId, logoutClient } from '../hooks/useClient';
import { ClientContextProvider, useClientContext, getPractitionerDisplayName } from '../context/ClientContext';

function PractitionerBanner() {
  const { client, practitioners, assignedPractitioner, selectPractitioner } = useClientContext();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!client) return null;

  async function handleSelect(id: string) {
    setSaving(true);
    await selectPractitioner(id);
    setSaving(false);
    setOpen(false);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: assignedPractitioner ? 'var(--surface)' : '#fff7ed',
          border: `1px solid ${assignedPractitioner ? 'var(--border)' : '#fed7aa'}`,
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          fontSize: '12px',
          color: assignedPractitioner ? 'var(--text-secondary)' : '#c2410c',
          whiteSpace: 'nowrap',
          maxWidth: '180px',
          overflow: 'hidden',
        }}
      >
        <UserCheck size={13} style={{ flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {assignedPractitioner
            ? getPractitionerDisplayName(assignedPractitioner)
            : 'Assign professional'}
        </span>
        <ChevronDown size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 100,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            minWidth: '200px',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 12px 6px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
              Your Professional
            </div>
            {practitioners.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                No professionals found
              </div>
            ) : (
              practitioners.map((p) => {
                const isSelected = client.practitioner_id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    disabled={saving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      background: isSelected ? 'var(--primary-light, #eff6ff)' : 'transparent',
                      border: 'none',
                      cursor: saving ? 'default' : 'pointer',
                      fontSize: '14px',
                      color: isSelected ? 'var(--primary)' : 'var(--text)',
                      fontWeight: isSelected ? '600' : '400',
                      textAlign: 'left',
                      opacity: saving && !isSelected ? 0.5 : 1,
                    }}
                  >
                    {getPractitionerDisplayName(p)}
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ClientLayoutInner() {
  const clientId = getLoggedInClientId();

  if (!clientId) {
    return <Navigate to="/app/login" replace />;
  }

  function handleLogout() {
    logoutClient();
    window.location.href = '/';
  }

  return (
    <div className="app-layout client-layout">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">B</div>
          <div>
            <h1>Buddy</h1>
            <span className="brand-tagline">Your symptom companion</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PractitionerBanner />
          <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-nav">
        <NavLink to="/app/checkin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardCheck size={20} />
          <span>Check-in</span>
        </NavLink>
        <NavLink to="/app/query" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle size={20} />
          <span>Query</span>
        </NavLink>
        <NavLink to="/app/timeline" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={20} />
          <span>Timeline</span>
        </NavLink>
        <NavLink to="/app/progress" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <TrendingUp size={20} />
          <span>Progress</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default function ClientLayout() {
  return (
    <ClientContextProvider>
      <ClientLayoutInner />
    </ClientContextProvider>
  );
}
