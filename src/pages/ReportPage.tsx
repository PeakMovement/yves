import { useState, useEffect } from 'react';
import { useActiveClient } from '../hooks/useClient';
import { generateReport, getCheckIns } from '../lib/store';
import type { FollowUpReport } from '../types/database';
import MiniChart from '../components/MiniChart';
import {
  formatDate,
  trendLabel,
  trendColor,
  painColor,
} from '../lib/utils';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  MessageSquare,
  Activity,
  Moon,
  Brain,
} from 'lucide-react';

export default function ReportPage() {
  const client = useActiveClient();
  const [report, setReport] = useState<FollowUpReport | null>(null);

  useEffect(() => {
    if (client) {
      const r = generateReport(client.id);
      setReport(r);
    }
  }, [client]);

  if (!client) return <div className="page-loading">Loading...</div>;

  const checkIns = getCheckIns(client.id);

  if (!report || checkIns.length === 0) {
    return (
      <div className="report-page">
        <div className="empty-state">
          <FileText size={48} color="#94a3b8" />
          <h2>No report yet</h2>
          <p>Complete at least one daily check-in to generate your follow-up report.</p>
        </div>
      </div>
    );
  }

  const s = report.summary;

  const TrendIcon = s.overall_trend === 'improving' ? TrendingUp
    : s.overall_trend === 'declining' ? TrendingDown
    : Minus;

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="report-title">
          <FileText size={24} />
          <div>
            <h2>Follow-Up Report</h2>
            <p className="report-meta">
              {client.full_name} &middot; {formatDate(report.period_start)} – {formatDate(report.period_end)}
            </p>
          </div>
        </div>
        <div className="report-badge" style={{ backgroundColor: trendColor(s.overall_trend) + '20', color: trendColor(s.overall_trend) }}>
          <TrendIcon size={16} />
          {trendLabel(s.overall_trend)}
        </div>
      </div>

      <div className="report-section">
        <h3>Overview</h3>
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
            <span className="stat-value" style={{ color: painColor(s.avg_pain_level) }}>{s.avg_pain_level}</span>
            <span className="stat-label">Avg Pain</span>
          </div>
        </div>
      </div>

      <div className="report-section">
        <h3><Activity size={16} /> Pain Trajectory</h3>
        <div className="card chart-card">
          <MiniChart data={s.pain_trend} label="Daily pain level" />
        </div>
      </div>

      <div className="report-section">
        <h3><Moon size={16} /> Sleep & <Brain size={16} /> Stress</h3>
        <div className="report-stats">
          <div className="stat-card">
            <span className="stat-value">{s.avg_sleep_quality}/5</span>
            <span className="stat-label">Avg Sleep</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{s.avg_stress_level}/5</span>
            <span className="stat-label">Avg Stress</span>
          </div>
        </div>
      </div>

      {s.symptom_changes.length > 0 && (
        <div className="report-section">
          <h3>Symptom Changes</h3>
          <div className="symptom-changes-list">
            {s.symptom_changes.map((sc, i) => (
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

      {s.flags.length > 0 && (
        <div className="report-section flags-section">
          <h3><AlertTriangle size={16} color="#f59e0b" /> Flags</h3>
          <ul className="flags-list">
            {s.flags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {s.client_notes_highlights.length > 0 && (
        <div className="report-section">
          <h3><MessageSquare size={16} /> Client Notes</h3>
          <ul className="notes-list">
            {s.client_notes_highlights.map((note, i) => (
              <li key={i}>"{note}"</li>
            ))}
          </ul>
        </div>
      )}

      <div className="report-section recommendation-section">
        <h3>Clinical Recommendation</h3>
        <p className="recommendation-text">{s.recommendation_for_practitioner}</p>
      </div>

      <div className="report-footer">
        <p>Generated by Buddy — Predictiv Symptom Tracker</p>
        <p>Report ID: {report.id.slice(0, 8)}</p>
      </div>
    </div>
  );
}
