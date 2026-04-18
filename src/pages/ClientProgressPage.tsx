import { useState, useEffect } from 'react';
import { useClientContext } from '../context/ClientContext';
import { getCheckIns, getSymptoms, getSymptomEntriesBySymptom, generateReport } from '../lib/store';
import type { CheckIn, Symptom, FollowUpReport } from '../types/database';
import MiniChart from '../components/MiniChart';
import { trendLabel, trendColor, painColor } from '../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Moon,
  Brain,
  Award,
} from 'lucide-react';

export default function ClientProgressPage() {
  const { client } = useClientContext();
  const [report, setReport] = useState<FollowUpReport | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [symptomData, setSymptomData] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client) {
      (async () => {
        const r = await generateReport(client.id);
        setReport(r);
        const cis = await getCheckIns(client.id);
        setCheckIns(cis);
        const syms = (await getSymptoms(client.id)).filter((s) => s.active);
        setSymptoms(syms);
        const data: Record<string, number[]> = {};
        for (const sym of syms) {
          const entries = await getSymptomEntriesBySymptom(sym.id);
          data[sym.id] = entries.map((e) => e.severity);
        }
        setSymptomData(data);
        setLoading(false);
      })();
    }
  }, [client]);

  if (!client || loading) return <div className="page-loading">Loading...</div>;

  if (!report || checkIns.length === 0) {
    return (
      <div className="progress-page">
        <div className="empty-state">
          <Award size={48} color="#94a3b8" />
          <h2>No progress yet</h2>
          <p>Complete your first daily check-in to start tracking your progress.</p>
        </div>
      </div>
    );
  }

  const s = report.summary;
  const TrendIcon = s.overall_trend === 'improving' ? TrendingUp
    : s.overall_trend === 'declining' ? TrendingDown
    : Minus;

  return (
    <div className="progress-page">
      <div className="page-header">
        <h2>Your Progress</h2>
      </div>

      <div className="progress-trend-card card">
        <div className="trend-display">
          <div className="trend-icon-wrap" style={{ backgroundColor: trendColor(s.overall_trend) + '20', color: trendColor(s.overall_trend) }}>
            <TrendIcon size={24} />
          </div>
          <div>
            <span className="trend-label" style={{ color: trendColor(s.overall_trend) }}>
              {trendLabel(s.overall_trend)}
            </span>
            <span className="trend-subtext">Overall trend based on your check-ins</span>
          </div>
        </div>
      </div>

      <div className="report-stats">
        <div className="stat-card">
          <span className="stat-value">{report.total_check_ins}</span>
          <span className="stat-label">Check-ins</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: painColor(s.avg_pain_level) }}>{s.avg_pain_level}</span>
          <span className="stat-label">Avg Pain</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{report.compliance_rate}%</span>
          <span className="stat-label">Consistency</span>
        </div>
      </div>

      <div className="card chart-card">
        <h3><Activity size={14} /> Pain Over Time</h3>
        <MiniChart data={s.pain_trend} label="Daily pain level" />
      </div>

      <div className="report-stats">
        <div className="stat-card">
          <Moon size={16} color="#6366f1" />
          <span className="stat-value">{s.avg_sleep_quality}/5</span>
          <span className="stat-label">Avg Sleep</span>
        </div>
        <div className="stat-card">
          <Brain size={16} color="#6366f1" />
          <span className="stat-value">{s.avg_stress_level}/5</span>
          <span className="stat-label">Avg Stress</span>
        </div>
      </div>

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

      {s.symptom_changes.length > 0 && (
        <div className="progress-symptoms card">
          <h3>Symptom Summary</h3>
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
      )}
    </div>
  );
}
