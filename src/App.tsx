import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ClientLayout from './components/ClientLayout';
import AdminLayout from './components/AdminLayout';
import PortalSelectPage from './pages/PortalSelectPage';
import ClientLoginPage from './pages/ClientLoginPage';
import PractitionerLoginPage from './pages/PractitionerLoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import CheckInPage from './pages/CheckInPage';
import QueryPage from './pages/QueryPage';
import TimelinePage from './pages/TimelinePage';
import ClientProgressPage from './pages/ClientProgressPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminClientsPage from './pages/AdminClientsPage';
import AdminClientDetailPage from './pages/AdminClientDetailPage';
import { initializePractitioners } from './lib/initPractitioners';

function App() {
  useEffect(() => {
    initializePractitioners();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Portal Selection */}
        <Route path="/" element={<PortalSelectPage />} />

        {/* Client Login */}
        <Route path="/app/login" element={<ClientLoginPage />} />

        {/* Practitioner Login */}
        <Route path="/admin/login" element={<PractitionerLoginPage />} />

        {/* Client Portal (requires login) */}
        <Route path="/app" element={<ClientLayout />}>
          <Route index element={<Navigate to="/app/checkin" replace />} />
          <Route path="checkin" element={<CheckInPage />} />
          <Route path="query" element={<QueryPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="progress" element={<ClientProgressPage />} />
        </Route>

        {/* Admin / Practitioner Portal */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="clients" element={<AdminClientsPage />} />
          <Route path="clients/:clientId" element={<AdminClientDetailPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
