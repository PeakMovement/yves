import { Outlet, NavLink } from 'react-router-dom';
import { ClipboardCheck, BarChart3, FileText, Users } from 'lucide-react';

export default function Layout() {
  return (
    <div className="app-layout">
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
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardCheck size={20} />
          <span>Check-in</span>
        </NavLink>
        <NavLink to="/timeline" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={20} />
          <span>Timeline</span>
        </NavLink>
        <NavLink to="/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Report</span>
        </NavLink>
        <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Clients</span>
        </NavLink>
      </nav>
    </div>
  );
}
