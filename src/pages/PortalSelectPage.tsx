import { useNavigate } from 'react-router-dom';
import { Stethoscope, User } from 'lucide-react';

export default function PortalSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="portal-select">
      <div className="portal-header">
        <div className="brand-icon brand-icon-lg">B</div>
        <h1>Buddy</h1>
        <p>Symptom tracking made simple</p>
      </div>

      <div className="portal-options">
        <button className="portal-card" onClick={() => navigate('/app')}>
          <div className="portal-icon client-icon">
            <User size={32} />
          </div>
          <h2>Client Portal</h2>
          <p>Daily check-ins, view your timeline, and track your progress between appointments.</p>
        </button>

        <button className="portal-card" onClick={() => navigate('/admin')}>
          <div className="portal-icon admin-icon">
            <Stethoscope size={32} />
          </div>
          <h2>Practitioner Portal</h2>
          <p>Manage clients, review check-in data, and generate clinical follow-up reports.</p>
        </button>
      </div>
    </div>
  );
}
