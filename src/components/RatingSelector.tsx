interface RatingSelectorProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  labels?: string[];
  max?: number;
}

export default function RatingSelector({
  value,
  onChange,
  label,
  labels = ['Very Poor', 'Poor', 'Average', 'Good', 'Great'],
  max = 5,
}: RatingSelectorProps) {
  return (
    <div className="rating-selector">
      <label>{label}</label>
      <div className="rating-options">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={`rating-btn ${value === n ? 'selected' : ''}`}
            onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
          >
            {n}
          </button>
        ))}
      </div>
      {labels[value - 1] && (
        <span className="rating-label">{labels[value - 1]}</span>
      )}
    </div>
  );
}
