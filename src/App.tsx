import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import ClientLayout from './components/ClientLayout';
import AdminLayout from './components/AdminLayout';
import PortalSelectPage from './pages/PortalSelectPage';
import ClientLoginPage from './pages/ClientLoginPage';
import ClientRegistrationPage from './pages/ClientRegistrationPage';
import PractitionerLoginPage from './pages/PractitionerLoginPage';
import CheckInPage from './pages/CheckInPage';
import QueryPage from './pages/QueryPage';
import TimelinePage from './pages/TimelinePage';
import ClientProgressPage from './pages/ClientProgressPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminClientsPage from './pages/AdminClientsPage';
import AdminClientDetailPage from './pages/AdminClientDetailPage';
import AdminPractitionersPage from './pages/AdminPractitionersPage';
import AdminRequestsPage from './pages/AdminRequestsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminAddClientPage from './pages/AdminAddClientPage';
import { initializePractitioners } from './lib/initPractitioners';

function App() {
  useEffect(() => {
    initializePractitioners();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PortalSelectPage />} />
          <Route path="/app/login" element={<ClientLoginPage />} />
          <Route path="/app/register" element={<ClientRegistrationPage />} />
          <Route path="/admin/login" element={<PractitionerLoginPage />} />

          <Route path="/app" element={<ClientLayout />}>
            <Route index element={<Navigate to="/app/checkin" replace />} />
            <Route path="checkin" element={<CheckInPage />} />
            <Route path="query" element={<QueryPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="progress" element={<ClientProgressPage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="clients/:clientId" element={<AdminClientDetailPage />} />
            <Route path="practitioners" element={<AdminPractitionersPage />} />
            <Route path="requests" element={<AdminRequestsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="add-client" element={<AdminAddClientPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
