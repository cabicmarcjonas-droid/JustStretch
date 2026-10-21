// src/lib/delayInjector.js
//
// Synthetic delay for Test Case 2 (paper, 4.2): makes one frame take longer than a
// frame interval, so the camera keeps producing frames while that one is still being
// processed. Those frames should be skipped (counted as dropped), not queued, and the
// overlay should never show an older frame after a newer one.
//
// Only active together with ?perf. URL options, all optional:
//   ?perf&delay=100                 add 100 ms to one frame (frame 150, after warm-up)
//   ?perf&delay=100&delayAt=300     ...to frame 300 instead
//   ?perf&delay=100&delayEvery=90   ...to frame 150 and then every 90th frame after it
//   ?perf&delay=100&delayEvery=90&delayCount=5   ...but at most 5 times
//
// The delay is a busy-wait on the main thread, the same place real work would block,
// so it holds up the frame loop exactly like a slow inference would.

const DEFAULT_DELAY_MS = 100
const DEFAULT_FIRST_FRAME = 150 // about 5 s in at 30 FPS, well past the perf warm-up
const MAX_DELAY_MS = 2000

const positiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

// Reads the options from a query string. Returns null when no delay was asked for.
export function parseDelayOptions(search = window.location.search) {
  const params = new URLSearchParams(search)
  if (!params.has('perf') || !params.has('delay')) return null

  const delayMs = Math.min(MAX_DELAY_MS, positiveInt(params.get('delay'), DEFAULT_DELAY_MS))
  const firstFrame = positiveInt(params.get('delayAt'), DEFAULT_FIRST_FRAME)
  const every = positiveInt(params.get('delayEvery'), 0)
  const maxCount = positiveInt(params.get('delayCount'), every ? Infinity : 1)
  return { delayMs, firstFrame, every, maxCount }
}

export class DelayInjector {
  constructor(options) {
    this.options = options
    this.reset()
  }

  get enabled() {
    return Boolean(this.options)
  }

  reset() {
    this.count = 0
  }

  // Whether frame `frameId` (1, 2, 3...) gets the delay.
  shouldDelay(frameId) {
    if (!this.options || this.count >= this.options.maxCount) return false
    const { firstFrame, every } = this.options
    if (frameId === firstFrame) return true
    return every > 0 && frameId > firstFrame && (frameId - firstFrame) % every === 0
  }

  // Call once per frame. Blocks for the delay when this frame is chosen and
  // returns how long it actually blocked (0 for every other frame).
  maybeDelay(frameId) {
    if (!this.shouldDelay(frameId)) return 0
    this.count += 1
    const start = performance.now()
    const until = start + this.options.delayMs
    // eslint-disable-next-line no-empty
    while (performance.now() < until) {}
    return performance.now() - start
  }

  describe() {
    if (!this.options) return null
    const { delayMs, firstFrame, every, maxCount } = this.options
    return { delayMs, firstFrame, every: every || null, maxCount: Number.isFinite(maxCount) ? maxCount : null }
  }
}
