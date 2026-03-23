import type { CheckIn } from '../types/database';
import { changeLabel, changeColor } from '../lib/utils';

const OPTIONS: CheckIn['symptom_change'][] = [
  'much_better',
  'slightly_better',
  'same',
  'slightly_worse',
  'much_worse',
];

interface Props {
  value: CheckIn['symptom_change'];
  onChange: (value: CheckIn['symptom_change']) => void;
}

export default function SymptomChangeSelector({ value, onChange }: Props) {
  return (
    <div className="symptom-change-selector">
      <label>How are your symptoms compared to yesterday?</label>
      <div className="change-options">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`change-btn ${value === option ? 'selected' : ''}`}
            style={value === option ? { borderColor: changeColor(option), backgroundColor: changeColor(option) + '18' } : {}}
            onClick={() => onChange(option)}
          >
            {changeLabel(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
