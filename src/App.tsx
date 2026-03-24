import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ClientLayout from './components/ClientLayout';
import AdminLayout from './components/AdminLayout';
import PortalSelectPage from './pages/PortalSelectPage';
import ClientLoginPage from './pages/ClientLoginPage';
import CheckInPage from './pages/CheckInPage';
import TimelinePage from './pages/TimelinePage';
import ClientProgressPage from './pages/ClientProgressPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminClientsPage from './pages/AdminClientsPage';
import AdminClientDetailPage from './pages/AdminClientDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Portal Selection */}
        <Route path="/" element={<PortalSelectPage />} />

        {/* Client Login */}
        <Route path="/app/login" element={<ClientLoginPage />} />

        {/* Client Portal (requires login) */}
        <Route path="/app" element={<ClientLayout />}>
          <Route index element={<Navigate to="/app/checkin" replace />} />
          <Route path="checkin" element={<CheckInPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="progress" element={<ClientProgressPage />} />
        </Route>

        {/* Admin / Practitioner Portal */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="clients" element={<AdminClientsPage />} />
          <Route path="clients/:clientId" element={<AdminClientDetailPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
