import { useEffect, useId, useRef, useState } from 'react'
import { formatMonthDay } from '../lib/format.js'

const MIN = 0
const MAX = 100
const TICKS = [0, 25, 50, 75, 100]

// Line chart of form scores, oldest on the left. `points` are { score, completedAt }.
// The viewBox follows the rendered width, so labels stay 11px on a phone instead of
// shrinking with a scaled-down drawing.
export default function ScoreChart({ points, height = 220, className = '' }) {
  const gradient = useId()
  const wrapper = useRef(null)
  const [width, setWidth] = useState(700)
  const drawable = points.length >= 2

  useEffect(() => {
    const el = wrapper.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))))
    observer.observe(el)
    return () => observer.disconnect()
  }, [drawable])

  if (!drawable) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-slate-50 text-sm text-muted ${className}`} style={{ height }}>
        Save a couple of sessions to see your trend.
      </div>
    )
  }

  const left = 34
  const right = 10
  const top = 10
  const bottom = 26
  const x = (i) => left + (i * (width - left - right)) / (points.length - 1)
  const y = (v) => top + (height - top - bottom) * (1 - (v - MIN) / (MAX - MIN))

  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ')
  const area = `M${x(0)},${y(MIN)} L${line.replaceAll(' ', ' L')} L${x(points.length - 1)},${y(MIN)} Z`
  const labelIdx = [...new Set([0, Math.round((points.length - 1) / 2), points.length - 1])]
  const lastIdx = points.length - 1

  return (
    <div ref={wrapper} className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label={`Form scores for your last ${points.length} sessions, latest ${points[lastIdx].score}`}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#047857" stopOpacity="0.18" />
            <stop offset="1" stopColor="#047857" stopOpacity="0" />
          </linearGradient>
        </defs>
        {TICKS.map((t) => (
          <g key={t}>
            <line x1={left} x2={width - right} y1={y(t)} y2={y(t)} stroke="#e2e8f0" vectorEffect="non-scaling-stroke" />
            <text x={left - 8} y={y(t) + 4} textAnchor="end" className="fill-slate-500 text-[11px]">
              {t}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#${gradient})`} />
        <polyline points={line} fill="none" stroke="#047857" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.score)}
            r={i === lastIdx ? 5 : 3}
            fill={i === lastIdx ? '#047857' : '#fff'}
            stroke="#047857"
            strokeWidth="2"
          />
        ))}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 6}
            textAnchor={i === 0 ? 'start' : i === lastIdx ? 'end' : 'middle'}
            className="fill-slate-500 text-[11px]"
          >
            {formatMonthDay(points[i].completedAt)}
          </text>
        ))}
      </svg>
    </div>
  )
}
