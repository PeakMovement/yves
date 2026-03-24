import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getClient,
  getCheckIns,
  getSymptoms,
  getSymptomEntriesBySymptom,
  generateReport,
} from '../lib/store';
import type { Client, CheckIn, Symptom, FollowUpReport } from '../types/database';
import MiniChart from '../components/MiniChart';
import {
  formatDate,
  timeAgo,
  changeLabel,
  changeColor,
  feelingEmoji,
  painColor,
  trendLabel,
  trendColor,
} from '../lib/utils';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Pill,
  MessageSquare,
  Activity,
  Moon,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
} from 'lucide-react';

export default function AdminClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [report, setReport] = useState<FollowUpReport | null>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (clientId) {
      const c = getClient(clientId);
      setClient(c ?? null);
      setCheckIns(getCheckIns(clientId));
      setSymptoms(getSymptoms(clientId).filter((s) => s.active));
    }
  }, [clientId]);

  function handleGenerateReport() {
    if (!clientId) return;
    const r = generateReport(clientId);
    setReport(r);
    setShowReport(true);
  }

  if (!client) {
    return (
      <div className="admin-detail">
        <div className="empty-state">
          <p>Client not found.</p>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/clients')}>
            Back to clients
          </button>
        </div>
      </div>
    );
  }

  const painData = [...checkIns].reverse().map((c) => c.pain_level);

  const TrendIcon = report
    ? report.summary.overall_trend === 'improving'
      ? TrendingUp
      : report.summary.overall_trend === 'declining'
        ? TrendingDown
        : Minus
    : Minus;

  return (
    <div className="admin-detail">
      <button className="btn btn-ghost back-btn" onClick={() => navigate('/admin/clients')}>
        <ArrowLeft size={16} /> Back to clients
      </button>

      <div className="detail-header">
        <div className="detail-info">
          <h2>{client.full_name}</h2>
          <p className="detail-complaint">{client.primary_complaint}</p>
          <div className="detail-meta">
            <span className="acr-code">Code: {client.login_code}</span>
            {client.email && <span>{client.email}</span>}
            {client.next_appointment && (
              <span><Calendar size={12} /> Next: {formatDate(client.next_appointment)}</span>
            )}
            <span>{checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button className="btn btn-primary generate-report-btn" onClick={handleGenerateReport}>
          <FileText size={18} />
          Generate Report
        </button>
      </div>

      {client.notes && (
        <div className="detail-notes card">
          <strong>Practitioner Notes:</strong> {client.notes}
        </div>
      )}

      {/* Report Section */}
      {showReport && report && (
        <div className="generated-report card">
          <div className="report-header">
            <div className="report-title">
              <FileText size={24} />
              <div>
                <h3>Follow-Up Report</h3>
                <p className="report-meta">
                  {formatDate(report.period_start)} – {formatDate(report.period_end)}
                </p>
              </div>
            </div>
            <div className="report-badge" style={{ backgroundColor: trendColor(report.summary.overall_trend) + '20', color: trendColor(report.summary.overall_trend) }}>
              <TrendIcon size={16} />
              {trendLabel(report.summary.overall_trend)}
            </div>
          </div>

          <div className="report-stats">
            <div className="stat-card">
              <span className="stat-value">{report.total_check_ins}</span>
              <span className="stat-label">Check-ins</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{report.compliance_rate}%</span>
              <span className="stat-label">Compliance</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ color: painColor(report.summary.avg_pain_level) }}>{report.summary.avg_pain_level}</span>
              <span className="stat-label">Avg Pain</span>
            </div>
          </div>

          <div className="report-section">
            <h4><Activity size={14} /> Pain Trajectory</h4>
            <div className="chart-card">
              <MiniChart data={report.summary.pain_trend} label="Daily pain level" />
            </div>
          </div>

          <div className="report-section">
            <h4><Moon size={14} /> Sleep & <Brain size={14} /> Stress</h4>
            <div className="report-stats">
              <div className="stat-card">
                <span className="stat-value">{report.summary.avg_sleep_quality}/5</span>
                <span className="stat-label">Avg Sleep</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{report.summary.avg_stress_level}/5</span>
                <span className="stat-label">Avg Stress</span>
              </div>
            </div>
          </div>

          {report.summary.symptom_changes.length > 0 && (
            <div className="report-section">
              <h4>Symptom Changes</h4>
              <div className="symptom-changes-list">
                {report.summary.symptom_changes.map((sc, i) => (
                  <div key={i} className="symptom-change-row">
                    <span className="sc-name">{sc.symptom_name}</span>
                    <span className="sc-values">{sc.start_severity} → {sc.end_severity}</span>
                    <span className="sc-trend" style={{ color: trendColor(sc.trend) }}>
                      {trendLabel(sc.trend)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.summary.flags.length > 0 && (
            <div className="report-section flags-section">
              <h4><AlertTriangle size={14} color="#f59e0b" /> Flags</h4>
              <ul className="flags-list">
                {report.summary.flags.map((flag, i) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {report.summary.client_notes_highlights.length > 0 && (
            <div className="report-section">
              <h4><MessageSquare size={14} /> Client Notes</h4>
              <ul className="notes-list">
                {report.summary.client_notes_highlights.map((note, i) => (
                  <li key={i}>"{note}"</li>
                ))}
              </ul>
            </div>
          )}

          <div className="report-section recommendation-section">
            <h4>Clinical Recommendation</h4>
            <p className="recommendation-text">{report.summary.recommendation_for_practitioner}</p>
          </div>

          <div className="report-footer">
            <p>Generated by Buddy — Predictiv Symptom Tracker</p>
            <p>Report ID: {report.id.slice(0, 8)} | Generated: {formatDate(report.generated_at)}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {painData.length > 1 && (
        <div className="card chart-card">
          <h3>Pain Trend</h3>
          <MiniChart data={painData} label="Pain level over time" />
        </div>
      )}

      {symptoms.length > 0 && (
        <div className="card chart-card">
          <h3>Symptom Trends</h3>
          {symptoms.map((sym) => {
            const entries = getSymptomEntriesBySymptom(sym.id);
            const data = entries.map((e) => e.severity);
            if (data.length === 0) return null;
            return <MiniChart key={sym.id} data={data} label={sym.name} />;
          })}
        </div>
      )}

      {/* Timeline */}
      <div className="detail-section">
        <h3>Check-in History</h3>
        <div className="timeline-list">
          {checkIns.map((ci) => {
            const expanded = expandedId === ci.id;
            return (
              <div
                key={ci.id}
                className={`timeline-entry ${ci.flagged ? 'flagged' : ''} ${expanded ? 'expanded' : ''}`}
                onClick={() => setExpandedId(expanded ? null : ci.id)}
              >
                <div className="timeline-entry-header">
                  <div className="entry-date">
                    <strong>{formatDate(ci.created_at)}</strong>
                    <span className="entry-time">{timeAgo(ci.created_at)}</span>
                  </div>
                  <div className="entry-badges">
                    {ci.flagged && <AlertTriangle size={16} color="#f59e0b" />}
                    <span className="feeling-badge">{feelingEmoji(ci.overall_feeling)}</span>
                    <span className="change-badge" style={{ color: changeColor(ci.symptom_change) }}>
                      {changeLabel(ci.symptom_change)}
                    </span>
                  </div>
                </div>

                <div className="entry-metrics">
                  <div className="metric">
                    <span className="metric-label">Pain</span>
                    <span className="metric-value" style={{ color: painColor(ci.pain_level) }}>
                      {ci.pain_level}/10
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Sleep</span>
                    <span className="metric-value">{ci.sleep_quality}/5</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Stress</span>
                    <span className="metric-value">{ci.stress_level}/5</span>
                  </div>
                </div>

                {expanded && (
                  <div className="entry-details">
                    {ci.medication_taken && (
                      <div className="detail-row">
                        <Pill size={14} /> Medication taken
                      </div>
                    )}
                    {ci.notes && (
                      <div className="detail-row notes-row">
                        <MessageSquare size={14} />
                        <span>{ci.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {checkIns.length === 0 && (
            <div className="empty-state">
              <p>No check-ins recorded yet for this client.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
