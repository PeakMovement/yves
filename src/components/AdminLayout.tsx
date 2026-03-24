import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';

export default function AdminLayout() {
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
          <NavLink to="/" className="sidebar-link">
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
