import { useEffect, useRef, useState } from 'react'
import { formatMonthDay } from '../lib/format.js'

const MIN = 40
const MAX = 100
const TICKS = [40, 60, 80, 100]
// The shaded target range: a form score of 80 or more counts as in range.
const TARGET = 80
const ACCENT = '#086e53'
const BAND = '#dff7ec'
const RULE = '#d9e2e1'
const MUTED = '#5f6c6c'

// Line chart of form scores, oldest on the left. `points` are { score, completedAt }.
// Scores below 40 sit on the bottom line. The viewBox follows the rendered width, so the
// labels stay 10px on a phone instead of shrinking with a scaled-down drawing.
export default function ScoreChart({ points, height = 220, className = '' }) {
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
      <div className={`flex items-center justify-center rounded-md bg-paper-2 text-sm text-muted ${className}`} style={{ height }}>
        Save a couple of sessions to see your trend.
      </div>
    )
  }

  const left = 30
  const right = 8
  const top = 8
  const bottom = 24
  const clamp = (v) => Math.max(MIN, Math.min(MAX, v))
  const x = (i) => left + (i * (width - left - right)) / (points.length - 1)
  const y = (v) => top + (height - top - bottom) * (1 - (clamp(v) - MIN) / (MAX - MIN))

  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ')
  const labelIdx = [...new Set([0, Math.round((points.length - 1) / 2), points.length - 1])]
  const lastIdx = points.length - 1

  return (
    <div ref={wrapper} className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label={`Form scores for your last ${points.length} sessions, latest ${points[lastIdx].score}. Target range ${TARGET} to ${MAX}.`}
      >
        <rect x={left} y={y(MAX)} width={width - left - right} height={y(TARGET) - y(MAX)} fill={BAND} />
        {TICKS.map((t) => (
          <g key={t}>
            <line x1={left} x2={width - right} y1={y(t)} y2={y(t)} stroke={RULE} vectorEffect="non-scaling-stroke" />
            <text x={left - 6} y={y(t) + 3.5} textAnchor="end" fill={MUTED} className="font-mono text-[10px]">
              {t}
            </text>
          </g>
        ))}
        {/* Keyed on the scores (not the pixels) so it draws itself in again when the
            data changes, but not on every resize. */}
        <polyline
          key={points.map((p) => `${p.completedAt}:${p.score}`).join('|')}
          points={line}
          pathLength="1"
          strokeDasharray="1"
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.8"
          strokeLinejoin="round"
          className="animate-line-draw"
        />
        {points.map((p, i) => (
          <rect
            key={i}
            x={x(i) - 3}
            y={y(p.score) - 3}
            width="6"
            height="6"
            fill={p.score >= TARGET ? ACCENT : '#fff'}
            stroke={ACCENT}
            strokeWidth="1.5"
          />
        ))}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 4}
            textAnchor={i === 0 ? 'start' : i === lastIdx ? 'end' : 'middle'}
            fill={MUTED}
            className="font-mono text-[10px]"
          >
            {formatMonthDay(points[i].completedAt)}
          </text>
        ))}
      </svg>
    </div>
  )
}

// Small legend swatch for the shaded target range.
export function TargetLegend() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="h-2.5 w-3.5 rounded-sm border border-accent-mid bg-accent-soft" aria-hidden="true" />
      Target range {TARGET} to {MAX}
    </span>
  )
}
