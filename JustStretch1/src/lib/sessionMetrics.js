// The bridge between the tracker's own names and the session fields we store.
//
// The tracker reports `joints` as { name, meanErrorDeg, inRangePct } and calls
// the frame count inside the margin `goodFrames`. A saved session stores them
// as `jointResults` as { joint, avgError, timeInRangePct } plus
// `framesWithinMargin`, so the stored record matches the paper's field names.

// What the user picked on the 1-5 fatigue scale.
export const FATIGUE_LABELS = {
  1: 'Fresh',
  2: 'Light',
  3: 'Moderate',
  4: 'Heavy',
  5: 'Exhausted',
}

// The tracking part of a session summary, shaped like the API expects it.
// Returns nothing for stretches that have no reference pose: they are scored
// by hand and carry no joint data.
export function toSessionMetrics(summary) {
  if (!summary) return {}

  const droppedFrames = summary.droppedFrames ?? null
  if (!summary.hasReference) return { droppedFrames }

  return {
    jointResults: (summary.joints ?? []).map((joint) => ({
      joint: joint.name,
      avgError: Number(joint.meanErrorDeg.toFixed(2)),
      timeInRangePct: joint.inRangePct,
    })),
    judgedFrames: summary.judgedFrames ?? null,
    framesWithinMargin: summary.goodFrames ?? null,
    trackingScore: summary.trackingScore ?? null,
    droppedFrames,
  }
}

// "left_shoulder" reads better as "left shoulder".
export function jointLabel(name) {
  return String(name ?? '').replace(/_/g, ' ')
}

// The perf summary (perfMonitor.js) in the shape the API stores, for ?perf runs.
export function toPerfPayload(perf) {
  if (!perf) return null
  return {
    frames: perf.frames,
    seconds: perf.seconds,
    fps: perf.fps?.overall ?? null,
    latencyMs: perf.latencyMs ?? null,
    processMs: perf.processMs ?? null,
    droppedPct: perf.droppedPct ?? null,
    noPosePct: perf.noPosePct ?? null,
    overBudgetPct: perf.overBudgetPct ?? null,
    injectedDelays: perf.injectedDelays ?? 0,
    outOfOrderFrames: perf.outOfOrderFrames ?? 0,
  }
}
