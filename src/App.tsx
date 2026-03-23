import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CheckInPage from './pages/CheckInPage';
import TimelinePage from './pages/TimelinePage';
import ReportPage from './pages/ReportPage';
import ClientsPage from './pages/ClientsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CheckInPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/clients" element={<ClientsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
