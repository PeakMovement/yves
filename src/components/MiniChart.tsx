import { painColor } from '../lib/utils';

interface MiniChartProps {
  data: number[];
  height?: number;
  max?: number;
  label?: string;
}

export default function MiniChart({ data, height = 60, max = 10, label }: MiniChartProps) {
  if (data.length === 0) return null;

  const width = 280;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((v, i) => {
    const x = padding + (data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth);
    const y = padding + chartHeight - (v / max) * chartHeight;
    return { x, y, v };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const lastPoint = points[points.length - 1];

  return (
    <div className="mini-chart">
      {label && <span className="mini-chart-label">{label}</span>}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={painColor(p.v)} />
        ))}
        <text x={lastPoint.x + 8} y={lastPoint.y + 4} fontSize="11" fill="#64748b">
          {lastPoint.v}
        </text>
      </svg>
    </div>
  );
}
