import { useEffect, useState } from "react";
import { fmtCompact, fmtMoney, fmtWeekday } from "./data";

/* ------------------------------ daily bar chart ----------------------------- */

export interface DayPoint {
  day: number;
  total: number;
}

export function DailyBars({
  data,
  year,
  month,
  animKey,
}: {
  data: DayPoint[];
  year: number;
  month: number;
  animKey: string;
}) {
  const [grown, setGrown] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    setGrown(false);
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
    return () => cancelAnimationFrame(r);
  }, [animKey]);

  const max = Math.max(1, ...data.map((d) => d.total));
  const spent = data.reduce((s, d) => s + d.total, 0);
  const activeDays = data.filter((d) => d.total > 0).length;
  const avg = activeDays > 0 ? spent / activeDays : 0;
  const avgPct = (avg / max) * 100;
  const hasData = spent > 0;

  return (
    <div>
      <div className="relative h-44 sm:h-52">
        {/* gridlines */}
        {[1, 0.5].map((f) => (
          <div key={f} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${f * 88}%` }}>
            <div className="h-px flex-1 border-t border-dashed border-white/[0.06]" />
            <span className="font-mono text-[10px] text-fog-600 w-10 text-right">{fmtCompact(max * f)}</span>
          </div>
        ))}

        {hasData && (
          <div className="absolute inset-x-0 z-10 flex items-center gap-2" style={{ bottom: `${avgPct * 0.88}%` }}>
            <div className="h-px flex-1 border-t border-gold-400/50" />
            <span className="font-mono text-[10px] text-gold-400 bg-gold-400/10 border border-gold-400/25 rounded px-1.5 py-0.5">
              avg {fmtCompact(avg)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 flex items-end gap-[3px] sm:gap-1.5 pr-12" onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => {
            const h = d.total > 0 ? Math.max(3, (d.total / max) * 88) : 0;
            const isHover = hover === i;
            const dow = fmtWeekday(year, month, d.day);
            const weekend = dow === "Sat" || dow === "Sun";
            const align = i < 3 ? "left-0" : i > data.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2";
            return (
              <div
                key={d.day}
                className="group relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
              >
                {isHover && d.total > 0 && (
                  <div className={`absolute bottom-full mb-2 z-20 ${align} whitespace-nowrap rounded-lg bg-pine-700 border border-white/10 px-2.5 py-1.5 shadow-lg shadow-black/40 fadein`}>
                    <p className="font-mono text-[12px] font-semibold text-lime-300">{fmtMoney(d.total)}</p>
                    <p className="font-mono text-[10px] text-fog-500">
                      {dow} {d.day}
                    </p>
                  </div>
                )}
                <div
                  className={`w-full rounded-[3px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    d.total === 0
                      ? "h-[3px] bg-white/[0.05]"
                      : isHover
                        ? "bg-lime-300 shadow-[0_0_18px_rgba(192,239,94,0.35)]"
                        : weekend
                          ? "bg-lime-500/55"
                          : "bg-lime-400/85"
                  }`}
                  style={{
                    height: grown ? (d.total === 0 ? 3 : `${h}%`) : "0%",
                    transitionDelay: `${i * 14}ms`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {!hasData && (
          <div className="absolute inset-0 grid place-items-center pr-12">
            <p className="text-[13.5px] text-fog-500">
              No spending recorded this month — <span className="text-fog-300">the bars will bloom here.</span>
            </p>
          </div>
        )}
      </div>

      {/* day labels */}
      <div className="mt-2 flex gap-[3px] sm:gap-1.5 pr-12">
        {data.map((d) => (
          <div key={d.day} className="flex-1 text-center">
            {d.day === 1 || d.day % 5 === 0 || d.day === data.length ? (
              <span className="font-mono text-[9.5px] text-fog-600">{d.day}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- budget ring ------------------------------ */

export function Ring({
  pct,
  size = 132,
  stroke = 11,
  color,
  children,
}: {
  pct: number; // 0..n (can exceed 1)
  size?: number;
  stroke?: number;
  color: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const shown = Math.min(pct, 1);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1), stroke 0.4s", filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ---------------------------------- sparkline ------------------------------- */

export function Sparkline({
  points,
  width = 220,
  height = 56,
  color,
  id,
}: {
  points: number[];
  width?: number;
  height?: number;
  color: string;
  id: string;
}) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pad = 4;
  const coords = points.map((p, i) => [
    (i / (points.length - 1)) * (width - pad * 2) + pad,
    height - pad - ((p - min) / span) * (height - pad * 2),
  ]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${height} L${coords[0][0].toFixed(1)},${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" className="spark-line" key={points.length + "-" + points[points.length - 1]} />
    </svg>
  );
}
