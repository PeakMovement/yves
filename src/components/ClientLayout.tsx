import { Outlet, NavLink } from 'react-router-dom';
import { ClipboardCheck, BarChart3, TrendingUp } from 'lucide-react';

export default function ClientLayout() {
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
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-nav">
        <NavLink to="/app" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardCheck size={20} />
          <span>Check-in</span>
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
