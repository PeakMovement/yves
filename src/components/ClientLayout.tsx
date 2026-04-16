import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { ClipboardCheck, MessageCircle, BarChart3, TrendingUp, LogOut } from 'lucide-react';
import { getLoggedInClientId, logoutClient } from '../hooks/useClient';

export default function ClientLayout() {
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
        <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
        </button>
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
