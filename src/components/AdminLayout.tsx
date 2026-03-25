import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Lock } from 'lucide-react';

const ADMIN_CODE = '1313';
const ADMIN_SESSION_KEY = 'buddy_admin_authed';

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (code.trim() === ADMIN_CODE) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      onUnlock();
    } else {
      setError('Incorrect access code.');
    }
  }

  return (
    <div className="client-login">
      <button className="btn btn-ghost back-link" onClick={() => navigate('/')}>
        &larr; Back
      </button>
      <div className="login-card">
        <div className="login-icon">
          <Lock size={32} />
        </div>
        <h2>Practitioner Access</h2>
        <p>Enter your access code to continue.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="code-input"
            placeholder="Access code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            autoFocus
            autoComplete="off"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-btn">
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'
  );

  if (!authed) {
    return <AdminGate onUnlock={() => setAuthed(true)} />;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">B</div>
          <div>
            <h1>Buddy</h1>
            <span className="brand-tagline">Practitioner Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/clients" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Clients</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/" className="sidebar-link" onClick={() => sessionStorage.removeItem(ADMIN_SESSION_KEY)}>
            <LogOut size={18} />
            <span>Switch Portal</span>
          </NavLink>
        </div>
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
