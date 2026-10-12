import { formatNumber } from "@/lib/format";

type PointValue = number | null;

type Series = {
  name?: string;
  color: string;
  values: PointValue[];
};

const VIEW_W = 760;
const BASE_H = 320;

function presentIndexes(values: PointValue[]) {
  return values.flatMap((value, index) => (typeof value === "number" ? [index] : []));
}

export function LineChart({
  labels,
  series,
  yMax,
  yStep,
  ariaLabel,
}: {
  labels: string[];
  series: Series[];
  yMax: number;
  yStep: number;
  ariaLabel: string;
}) {
  const named = series.some((item) => item.name);
  const crowded = labels.length > 8;
  const viewH = BASE_H;
  const pad = { l: 52, r: named ? 132 : 36, t: 28, b: crowded ? 44 : 36 };
  const labelSize = crowded ? 8 : 12;
  const innerW = VIEW_W - pad.l - pad.r;
  const innerH = viewH - pad.t - pad.b;
  const xAt = (index: number) =>
    pad.l + (labels.length <= 1 ? innerW / 2 : (index / (labels.length - 1)) * innerW);
  const yAt = (value: number) => pad.t + (1 - Math.min(value, yMax) / yMax) * innerH;
  const ticks: number[] = [];
  for (let tick = 0; tick <= yMax; tick += yStep) ticks.push(tick);
  const axisY = viewH - pad.b;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${viewH}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={pad.l}
            x2={VIEW_W - pad.r}
            y1={yAt(tick)}
            y2={yAt(tick)}
            stroke={tick === 0 ? "#222" : "#d5d5d5"}
            strokeWidth={tick === 0 ? 1.25 : 1}
          />
          <text x={pad.l - 8} y={yAt(tick) + 4} textAnchor="end" fontSize="12" fill="#222">
            {formatNumber(tick)}
          </text>
        </g>
      ))}
      <line x1={pad.l} x2={pad.l} y1={pad.t} y2={axisY} stroke="#222" strokeWidth="1.25" />
      {labels.map((label, index) => {
        const x = xAt(index);
        return (
          <g key={`${label}-${index}`}>
            <line x1={x} x2={x} y1={axisY} y2={axisY + 4} stroke="#222" strokeWidth="1" />
            <text x={x} y={axisY + (crowded ? 14 : 16)} textAnchor="middle" fontSize={labelSize} fill="#222">
              {label}
            </text>
          </g>
        );
      })}
      {series.map((item) => {
        const plotted = presentIndexes(item.values).map((index) => ({
          index,
          value: item.values[index] as number,
        }));
        if (!plotted.length) return null;
        if (plotted.length === 1) {
          const point = plotted[0];
          return <circle key={item.name ?? item.color} cx={xAt(point.index)} cy={yAt(point.value)} r="4" fill={item.color} />;
        }
        const points = plotted.map((point) => `${xAt(point.index)},${yAt(point.value)}`).join(" ");
        return (
          <polyline
            key={item.name ?? item.color}
            points={points}
            fill="none"
            stroke={item.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
      {labels.map((_, index) => {
        const anchor = index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle";
        const x = index === 0 ? xAt(index) + 4 : index === labels.length - 1 ? xAt(index) - 2 : xAt(index);
        const ranked = series
          .map((item, seriesIndex) => {
            const present = presentIndexes(item.values);
            const show =
              present.includes(index) && (present.length > 10 ? index === present[present.length - 1] : true);
            const value = item.values[index];
            if (!show || typeof value !== "number") return null;
            return { seriesIndex, value, pointY: yAt(value) };
          })
          .filter((item): item is { seriesIndex: number; value: number; pointY: number } => item != null)
          .sort((a, b) => a.pointY - b.pointY);
        return ranked.map((item, rank) => {
          const tight = rank > 0 && Math.abs(item.pointY - ranked[rank - 1].pointY) < 18;
          const y = tight ? Math.min(axisY - 4, item.pointY + 16) : Math.max(14, item.pointY - 8);
          return (
            <text
              key={`${item.seriesIndex}-${index}`}
              x={x}
              y={y}
              textAnchor={anchor}
              fontSize="11"
              fontWeight="700"
              fill="#111"
            >
              {formatNumber(item.value)}
            </text>
          );
        });
      })}
      {named &&
        series.map((item, index) => (
          <g key={item.name} transform={`translate(${VIEW_W - pad.r + 18}, ${pad.t + innerH / 2 - 10 + index * 22})`}>
            <line x1="0" y1="0" x2="26" y2="0" stroke={item.color} strokeWidth="3" />
            <text x="32" y="4" fontSize="12" fill="#111">
              {item.name}
            </text>
          </g>
        ))}
    </svg>
  );
}
