import { painColor } from '../lib/utils';

interface PainSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

export default function PainSlider({ value, onChange, label = 'Pain Level', min = 0, max = 10 }: PainSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const color = painColor(value);

  return (
    <div className="pain-slider">
      <div className="pain-slider-header">
        <label>{label}</label>
        <span className="pain-value" style={{ color }}>{value}/{max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
        style={{
          background: `linear-gradient(to right, ${color} ${percentage}%, #e2e8f0 ${percentage}%)`,
        }}
      />
      <div className="pain-labels">
        <span>None</span>
        <span>Severe</span>
      </div>
    </div>
  );
}
