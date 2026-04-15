import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { useActivePractitioner, logoutPractitioner } from '../hooks/usePractitioner';

export default function AdminLayout() {
  const navigate = useNavigate();
  const practitioner = useActivePractitioner();

  // If not authenticated as a practitioner, redirect to login
  if (!practitioner) {
    return <Navigate to="/admin/login" replace />;
  }

  function handleLogout() {
    logoutPractitioner();
    navigate('/');
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
          <button className="sidebar-link" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
