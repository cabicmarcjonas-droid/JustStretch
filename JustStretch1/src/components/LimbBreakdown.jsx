import { LIMBS, limbLabel } from '../lib/limbs.js'
import { statLabel } from '../lib/ui.js'

// Form-quality labels for one limb's score (Feature: per-session limb view).
//   >= 85  Great form
//   60-84  Needs slight adjustment
//    < 60  Focus on this area
// Limbs the camera never judged are shown as "Not assessed", never as 0%.
function formLabel(score) {
  if (score == null) return null
  if (score >= 85) return { text: 'Great form', tone: 'ok', fill: 'bg-accent' }
  if (score >= 60) return { text: 'Needs slight adjustment', tone: 'caution', fill: 'bg-caution-bright' }
  return { text: 'Focus on this area', tone: 'danger', fill: 'bg-danger' }
}

const tagBase = 'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium'
const tagTone = {
  ok: 'bg-accent-soft text-accent-dark',
  caution: 'bg-caution-soft text-caution',
  danger: 'bg-danger-soft text-danger',
}

// Per-limb bars for one session's limbResults (or the dashboard's aggregated
// breakdown). Each row: limb label, a thin bar scaled to the score, the % and the
// form label. `showMissing` lists every known limb and marks the absent ones
// "Not assessed"; the dashboard passes false because it only shows selected limbs.
// `highlightWeakest` tags the lowest scored limb so the member can compare at a glance.
export default function LimbBreakdown({ results = [], showMissing = true, highlightWeakest = false, heading = 'Limb breakdown', className = '' }) {
  const byLimb = new Map(results.filter((row) => row.score != null).map((row) => [row.limb, row]))
  const scored = [...byLimb.values()]
  const weakest = highlightWeakest && scored.length > 1 ? scored.reduce((a, b) => (b.score < a.score ? b : a)) : null
  const rows = showMissing ? LIMBS.map((limb) => byLimb.get(limb.id) ?? { limb: limb.id, score: null }) : LIMBS.filter((limb) => byLimb.has(limb.id)).map((limb) => byLimb.get(limb.id))

  if (rows.length === 0) return null

  return (
    <div className={className}>
      <h3 className={statLabel}>{heading}</h3>
      <ul className="mt-2 space-y-2.5">
        {rows.map((row) => {
          const label = formLabel(row.score)
          const isWeakest = weakest != null && weakest.limb === row.limb
          return (
            <li key={row.limb}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-ink">{limbLabel(row.limb)}</span>
                <span className="flex items-center gap-2">
                  {isWeakest && <span className={`${tagBase} bg-caution-soft text-caution`}>Weakest</span>}
                  {label ? (
                    <>
                      <span className="font-mono text-sm font-medium tabular-nums text-ink">{`${row.score}%`}</span>
                      <span className={`${tagBase} ${tagTone[label.tone]}`}>{label.text}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted">{row.judgedFrames != null ? 'No data yet' : 'Not assessed'}</span>
                  )}
                </span>
              </div>
              {/* 1px-rule look: a flat track, no shadow, accent fill scaled to the score.
                  Scaled with a transform rather than width so the grow on mount and the
                  glide between scores stay on the compositor. */}
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-sm bg-paper-2" aria-hidden="true">
                {label && (
                  <div
                    className={`h-full origin-left animate-bar-grow transition-[transform,background-color] duration-700 ease-out-expo ${label.fill}`}
                    style={{ transform: `scaleX(${Math.max(2, row.score) / 100})` }}
                  />
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
