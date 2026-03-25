import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getClient,
  getCheckIns,
  getSymptoms,
  getSymptomEntriesBySymptom,
  generateReport,
  calculateComplianceRating,
} from '../lib/store';
import type { Client, CheckIn, Symptom, FollowUpReport } from '../types/database';
import type { ComplianceRating } from '../lib/store';
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
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

export default function AdminClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [symptomData, setSymptomData] = useState<Record<string, number[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [report, setReport] = useState<FollowUpReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [compliance, setCompliance] = useState<ComplianceRating | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      (async () => {
        const c = await getClient(clientId);
        setClient(c ?? null);
        const cis = await getCheckIns(clientId);
        setCheckIns(cis);
        const syms = (await getSymptoms(clientId)).filter((s) => s.active);
        setSymptoms(syms);
        const data: Record<string, number[]> = {};
        for (const sym of syms) {
          const entries = await getSymptomEntriesBySymptom(sym.id);
          data[sym.id] = entries.map((e) => e.severity);
        }
        setSymptomData(data);
        if (c) setCompliance(calculateComplianceRating(c, cis));
        setLoading(false);
      })();
    }
  }, [clientId]);

  async function handleGenerateReport() {
    if (!clientId) return;
    const r = await generateReport(clientId);
    setReport(r);
    setShowReport(true);
  }

  if (loading) return <div className="page-loading">Loading...</div>;

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

      {/* Compliance Rating */}
      {compliance && compliance.grade !== 'No Data' && (
        <div className="compliance-card card">
          <div className="compliance-header">
            <div className="compliance-title">
              <ShieldCheck size={20} />
              <h3>Compliance Rating</h3>
            </div>
            <div className="compliance-score-badge" style={{ backgroundColor: compliance.color + '18', color: compliance.color, borderColor: compliance.color + '40' }}>
              <span className="compliance-score-value">{compliance.score}</span>
              <span className="compliance-score-label">{compliance.grade}</span>
            </div>
          </div>

          <div className="compliance-bar-outer">
            <div
              className="compliance-bar-fill"
              style={{ width: `${compliance.score}%`, backgroundColor: compliance.color }}
            />
          </div>

          <div className="compliance-breakdown">
            {Object.values(compliance.breakdown).map((item) => (
              <div key={item.label} className="compliance-item">
                <div className="compliance-item-header">
                  <span className="compliance-item-label">{item.label}</span>
                  <span className="compliance-item-score">{item.score}/100</span>
                </div>
                <div className="compliance-item-bar-outer">
                  <div
                    className="compliance-item-bar-fill"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <p className="compliance-item-detail">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {compliance && compliance.grade === 'No Data' && (
        <div className="compliance-card card compliance-empty">
          <ShieldCheck size={20} color="#94a3b8" />
          <p>Compliance rating will appear after the client completes their first check-in.</p>
        </div>
      )}

      {/* Report Section */}
      {showReport && !report && (
        <div className="card compliance-empty" style={{ marginBottom: 20 }}>
          <FileText size={20} color="#94a3b8" />
          <p>No check-in data yet. The report will be available once this client completes at least one check-in.</p>
        </div>
      )}

      {showReport && report && (
        <div className="generated-report">
          <div className="report-brand">
            <h2 className="report-brand-name">PEAK MOVEMENT</h2>
            <span className="report-brand-sub">Client Follow-Up Report</span>
          </div>

          <div className="report-divider" />

          <div className="report-client-info">
            <div className="report-client-left">
              <h3>{client.full_name}</h3>
              <p>{client.primary_complaint}</p>
            </div>
            <div className="report-client-right">
              <p>{formatDate(report.period_start)} – {formatDate(report.period_end)}</p>
              <p>{report.total_check_ins} check-in{report.total_check_ins !== 1 ? 's' : ''} recorded</p>
            </div>
          </div>

          <div className="report-divider" />

          <div className="report-trend-row">
            <div className="report-trend-badge" style={{ backgroundColor: trendColor(report.summary.overall_trend) + '15', color: trendColor(report.summary.overall_trend), borderColor: trendColor(report.summary.overall_trend) + '30' }}>
              <TrendIcon size={20} />
              <span>{trendLabel(report.summary.overall_trend)}</span>
            </div>
            <span className="report-trend-caption">Overall trend across reporting period</span>
          </div>

          <div className="report-section">
            <h4 className="report-section-title">Key Metrics</h4>
            <div className="report-metrics-grid">
              <div className="report-metric">
                <span className="report-metric-value" style={{ color: painColor(report.summary.avg_pain_level) }}>{report.summary.avg_pain_level}</span>
                <span className="report-metric-label">Avg Pain</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-value">{report.summary.avg_sleep_quality}/5</span>
                <span className="report-metric-label">Avg Sleep</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-value">{report.summary.avg_stress_level}/5</span>
                <span className="report-metric-label">Avg Stress</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-value">{report.compliance_rate}%</span>
                <span className="report-metric-label">Compliance</span>
              </div>
            </div>
          </div>

          <div className="report-section">
            <h4 className="report-section-title"><Activity size={14} /> Pain Trajectory</h4>
            <div className="report-chart-wrap">
              <MiniChart data={report.summary.pain_trend} label="Daily pain level" />
            </div>
          </div>

          {report.summary.symptom_changes.length > 0 && (
            <div className="report-section">
              <h4 className="report-section-title">Symptom Changes</h4>
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
            <div className="report-section">
              <h4 className="report-section-title"><AlertTriangle size={14} color="#f59e0b" /> Flags</h4>
              <div className="report-flags">
                {report.summary.flags.map((flag, i) => (
                  <div key={i} className="report-flag-item">{flag}</div>
                ))}
              </div>
            </div>
          )}

          {report.summary.client_notes_highlights.length > 0 && (
            <div className="report-section">
              <h4 className="report-section-title"><MessageSquare size={14} /> Client Notes</h4>
              <div className="report-notes-list">
                {report.summary.client_notes_highlights.map((note, i) => (
                  <div key={i} className="report-note-item">"{note}"</div>
                ))}
              </div>
            </div>
          )}

          <div className="report-section">
            <h4 className="report-section-title">Clinical Recommendation</h4>
            <div className="report-recommendation">
              <p>{report.summary.recommendation_for_practitioner}</p>
            </div>
          </div>

          <div className="report-divider" />

          <div className="report-footer">
            <span className="report-footer-brand">PEAK MOVEMENT</span>
            <span className="report-footer-meta">Report {report.id.slice(0, 8)} | Generated {formatDate(report.generated_at)}</span>
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
            const data = symptomData[sym.id] || [];
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
