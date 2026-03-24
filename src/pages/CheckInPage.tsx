import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, PartyPopper } from 'lucide-react';
import { useActiveClient } from '../hooks/useClient';
import PainSlider from '../components/PainSlider';
import RatingSelector from '../components/RatingSelector';
import SymptomChangeSelector from '../components/SymptomChangeSelector';
import {
  hasCheckedInToday,
  getSymptoms,
  createCheckIn,
  createSymptomEntry,
  isTrackingComplete,
  trackDeviceVisit,
} from '../lib/store';
import type { CheckIn, Symptom } from '../types/database';
import { feelingEmoji, formatDate } from '../lib/utils';

type Step = 'greeting' | 'overall' | 'change' | 'pain' | 'symptoms' | 'sleep_stress' | 'medication' | 'notes' | 'done';

const STEPS: Step[] = ['greeting', 'overall', 'change', 'pain', 'symptoms', 'sleep_stress', 'medication', 'notes', 'done'];

export default function CheckInPage() {
  const client = useActiveClient();
  const navigate = useNavigate();
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [step, setStep] = useState<Step>('greeting');
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [symptomSeverities, setSymptomSeverities] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    overall_feeling: 3 as 1 | 2 | 3 | 4 | 5,
    symptom_change: 'same' as CheckIn['symptom_change'],
    pain_level: 5,
    sleep_quality: 3 as 1 | 2 | 3 | 4 | 5,
    stress_level: 3 as 1 | 2 | 3 | 4 | 5,
    medication_taken: false,
    notes: '',
  });

  useEffect(() => {
    if (client) {
      setAlreadyDone(hasCheckedInToday(client.id));
      const s = getSymptoms(client.id).filter((sym) => sym.active);
      setSymptoms(s);
      const initial: Record<string, number> = {};
      s.forEach((sym) => { initial[sym.id] = 5; });
      setSymptomSeverities(initial);
    }
  }, [client]);

  if (!client) return <div className="page-loading">Loading...</div>;

  if (isTrackingComplete(client)) {
    return (
      <div className="checkin-page">
        <div className="checkin-card done-card tracking-complete-card">
          <PartyPopper size={48} color="#6366f1" />
          <h2>Your tracking journey is complete!</h2>
          <p>
            Great work, {client.full_name.split(' ')[0]}! Your tracking period has ended. All your check-in data has been recorded and is ready for your practitioner to review.
          </p>
          <p className="tracking-complete-cta">Time to see the physio — book your follow-up appointment to go over your progress together.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/app/timeline')}>
            View your timeline
          </button>
        </div>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(step);
  const progress = Math.round(((stepIndex) / (STEPS.length - 1)) * 100);

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function back() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  function submit() {
    const checkIn = createCheckIn({
      client_id: client!.id,
      ...form,
    });

    symptoms.forEach((sym) => {
      createSymptomEntry({
        check_in_id: checkIn.id,
        symptom_id: sym.id,
        severity: symptomSeverities[sym.id] ?? 5,
        notes: '',
      });
    });

    trackDeviceVisit(client!.id, 'checkin');
    setStep('done');
  }

  if (alreadyDone) {
    return (
      <div className="checkin-page">
        <div className="checkin-card done-card">
          <CheckCircle size={48} color="#10b981" />
          <h2>All done for today!</h2>
          <p>You've already completed your daily check-in. Come back tomorrow and let me know how you're doing.</p>
          <p className="next-checkin">Your next appointment: <strong>{client.next_appointment ? formatDate(client.next_appointment) : 'Not set'}</strong></p>
          <button className="btn btn-secondary" onClick={() => navigate('/app/timeline')}>
            View your timeline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-page">
      {step !== 'done' && step !== 'greeting' && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="checkin-card">
        {step === 'greeting' && (
          <div className="step-content greeting-step">
            <h2>Hey {client.full_name.split(' ')[0]}! 👋</h2>
            <p>Time for your daily check-in. This takes about 2 minutes and helps your practitioner understand how you're doing between visits.</p>
            <p className="subtext">Everything you share here goes into your follow-up report — so you don't have to remember it all at your next appointment.</p>
            <button className="btn btn-primary" onClick={next}>Let's get started</button>
          </div>
        )}

        {step === 'overall' && (
          <div className="step-content">
            <h2>How are you feeling overall today?</h2>
            <div className="feeling-selector">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`feeling-btn ${form.overall_feeling === n ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, overall_feeling: n as 1 | 2 | 3 | 4 | 5 })}
                >
                  <span className="feeling-emoji">{feelingEmoji(n)}</span>
                  <span className="feeling-label">{['Terrible', 'Poor', 'Okay', 'Good', 'Great'][n - 1]}</span>
                </button>
              ))}
            </div>
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary" onClick={next}>Next</button>
            </div>
          </div>
        )}

        {step === 'change' && (
          <div className="step-content">
            <SymptomChangeSelector
              value={form.symptom_change}
              onChange={(v) => setForm({ ...form, symptom_change: v })}
            />
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary" onClick={next}>Next</button>
            </div>
          </div>
        )}

        {step === 'pain' && (
          <div className="step-content">
            <h2>What's your pain level right now?</h2>
            <PainSlider
              value={form.pain_level}
              onChange={(v) => setForm({ ...form, pain_level: v })}
            />
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary" onClick={next}>Next</button>
            </div>
          </div>
        )}

        {step === 'symptoms' && symptoms.length > 0 && (
          <div className="step-content">
            <h2>Rate each of your symptoms</h2>
            <p className="subtext">How severe is each symptom today? (0 = none, 10 = worst)</p>
            {symptoms.map((sym) => (
              <PainSlider
                key={sym.id}
                label={`${sym.name} (${sym.body_area})`}
                value={symptomSeverities[sym.id] ?? 5}
                onChange={(v) => setSymptomSeverities({ ...symptomSeverities, [sym.id]: v })}
              />
            ))}
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary" onClick={next}>Next</button>
            </div>
          </div>
        )}

        {step === 'symptoms' && symptoms.length === 0 && (
          <div className="step-content">
            <h2>No tracked symptoms yet</h2>
            <p>Your practitioner hasn't added specific symptoms to track yet. That's okay — we'll still capture your overall progress.</p>
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary" onClick={next}>Next</button>
            </div>
          </div>
        )}

        {step === 'sleep_stress' && (
          <div className="step-content">
            <RatingSelector
              label="How did you sleep last night?"
              value={form.sleep_quality}
              onChange={(v) => setForm({ ...form, sleep_quality: v as 1 | 2 | 3 | 4 | 5 })}
              labels={['Terrible', 'Poor', 'Average', 'Good', 'Great']}
            />
            <RatingSelector
              label="What's your stress level today?"
              value={form.stress_level}
              onChange={(v) => setForm({ ...form, stress_level: v as 1 | 2 | 3 | 4 | 5 })}
              labels={['Very Low', 'Low', 'Moderate', 'High', 'Very High']}
            />
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary" onClick={next}>Next</button>
            </div>
          </div>
        )}

        {step === 'medication' && (
          <div className="step-content">
            <h2>Did you take any medication today?</h2>
            <div className="med-options">
              <button
                className={`med-btn ${form.medication_taken ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, medication_taken: true })}
              >
                Yes
              </button>
              <button
                className={`med-btn ${!form.medication_taken ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, medication_taken: false })}
              >
                No
              </button>
            </div>
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary" onClick={next}>Next</button>
            </div>
          </div>
        )}

        {step === 'notes' && (
          <div className="step-content">
            <h2>Anything else you want to note?</h2>
            <p className="subtext">Activities, triggers, things that helped or made it worse — anything your practitioner should know.</p>
            <textarea
              className="notes-input"
              rows={4}
              placeholder="e.g. 'Went for a walk and it helped' or 'Sitting at my desk all day made it worse'"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            {(form.pain_level >= 8 || form.symptom_change === 'much_worse') && (
              <div className="flag-warning">
                <AlertTriangle size={18} color="#f59e0b" />
                <span>This check-in will be flagged for your practitioner due to high severity.</span>
              </div>
            )}
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary" onClick={submit}>Submit check-in</button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="step-content greeting-step">
            <CheckCircle size={48} color="#10b981" />
            <h2>Check-in complete!</h2>
            <p>Thanks {client.full_name.split(' ')[0]}. This has been recorded and will be included in your follow-up report.</p>
            <button className="btn btn-secondary" onClick={() => navigate('/app/timeline')}>
              View your timeline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
