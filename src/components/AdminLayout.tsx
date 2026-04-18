import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, KeyRound, Stethoscope, MessageSquare, Settings, UserPlus } from 'lucide-react';
import { useActivePractitioner, logoutPractitioner } from '../hooks/usePractitioner';

export default function AdminLayout() {
  const navigate = useNavigate();
  const practitioner = useActivePractitioner();

  if (!practitioner) {
    return <Navigate to="/admin/login" replace />;
  }

  const isAdmin = practitioner.is_admin === true;

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
            <span className="brand-tagline">{isAdmin ? 'Admin Portal' : 'Practitioner Portal'}</span>
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

          {isAdmin && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              <NavLink to="/admin/practitioners" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Stethoscope size={18} />
                <span>Practitioners</span>
              </NavLink>
              <NavLink to="/admin/requests" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <MessageSquare size={18} />
                <span>All Requests</span>
              </NavLink>
              <NavLink to="/admin/add-client" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <UserPlus size={18} />
                <span>Add Client</span>
              </NavLink>
              <NavLink to="/admin/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Settings size={18} />
                <span>Settings</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/admin/change-password" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <KeyRound size={18} />
            <span>Change Password</span>
          </NavLink>
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
