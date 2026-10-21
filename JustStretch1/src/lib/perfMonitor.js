// src/lib/perfMonitor.js
//
// Collects the numbers from Table 6 / Table 7 of the paper while a session runs:
//   FPS, frame processing time, latency (capture -> overlay drawn), dropped frames
//   and the share of frames where no pose was found.
//
// The tracker calls record() once per processed frame and summary() when the session ends.
// Open the session page with ?perf in the URL to also see a line per second in the console.
 
const round = (n, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits
 
function stats(values) {
  if (!values.length) return null
  let sum = 0
  let min = Infinity
  let max = -Infinity
  for (const v of values) {
    sum += v
    if (v < min) min = v
    if (v > max) max = v
  }
  const sorted = [...values].sort((a, b) => a - b)
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
  return { avg: round(sum / values.length), min: round(min), max: round(max), p95: round(p95) }
}
 
export class PerfMonitor {
  /**
   * @param {object} options
   * @param {number} options.budgetMs      Per-frame processing budget (33 ms keeps 30 FPS).
   * @param {number} options.warmupFrames  Frames ignored at the start: the first inference
   *                                       compiles GPU shaders and is much slower than the rest.
   * @param {number} options.maxSamples    Cap on stored samples (20000 is about 11 minutes at 30 FPS).
   * @param {boolean} options.log          Print one console line per second.
   */
  constructor({ budgetMs = 33, warmupFrames = 10, maxSamples = 20000, log = false } = {}) {
    this.budgetMs = budgetMs
    this.warmupFrames = warmupFrames
    this.maxSamples = maxSamples
    this.log = log
    this.reset()
  }
 
  reset() {
    this.seen = 0 // every frame handed to record(), warm-up included
    this.frames = 0 // frames that count towards the stats
    this.startedAt = null
    this.lastAt = null
    this.windowStart = null
    this.windowFrames = 0
    this.fpsWindows = []
    this.inference = []
    this.process = []
    this.latency = []
    this.latencyFromCapture = 0
    this.dropped = 0
    this.droppedUnknown = false
    this.noPose = 0
    this.overBudget = 0
    this.emaProcessMs = 0 // smoothed processing time, used by the tracker to back off
  }
 
  /**
   * @param {object} sample
   * @param {number} sample.inferenceMs  Time spent in the pose (and hand) models.
   * @param {number} sample.processMs    Inference plus angle comparison and scoring.
   * @param {number} sample.latencyMs    Camera capture (or callback start) to overlay drawn.
   * @param {boolean} sample.fromCapture True when latencyMs starts at the camera's capture time.
   * @param {boolean} sample.poseFound   False when the model found no body in the frame.
   * @param {number|null} sample.dropped Camera frames skipped since the previous processed frame;
   *                                     null when the browser cannot tell.
   * @param {number} sample.now          performance.now() at the end of the frame.
   */
  record({ inferenceMs, processMs, latencyMs, fromCapture, poseFound, dropped, now = performance.now() }) {
    this.seen += 1
    if (this.seen <= this.warmupFrames) return
 
    if (this.startedAt === null) {
      this.startedAt = now
      this.windowStart = now
    }
    this.frames += 1
    this.lastAt = now
 
    if (this.process.length < this.maxSamples) {
      this.inference.push(inferenceMs)
      this.process.push(processMs)
      this.latency.push(latencyMs)
    }
    if (fromCapture) this.latencyFromCapture += 1
    if (!poseFound) this.noPose += 1
    if (processMs > this.budgetMs) this.overBudget += 1
    if (dropped === null || dropped === undefined) this.droppedUnknown = true
    else this.dropped += dropped
 
    this.emaProcessMs = this.emaProcessMs === 0 ? processMs : this.emaProcessMs + 0.1 * (processMs - this.emaProcessMs)
 
    // One FPS reading per second, so the summary can show the slowest and fastest second.
    this.windowFrames += 1
    const elapsed = now - this.windowStart
    if (elapsed >= 1000) {
      const fps = (this.windowFrames * 1000) / elapsed
      this.fpsWindows.push(fps)
      if (this.log) {
        console.log(
          `[perf] ${fps.toFixed(1)} FPS | process ${processMs.toFixed(1)} ms | latency ${latencyMs.toFixed(1)} ms`,
        )
      }
      this.windowStart = now
      this.windowFrames = 0
    }
  }
 
  summary() {
    const total = this.frames
    const seconds = this.startedAt === null ? 0 : (this.lastAt - this.startedAt) / 1000
    const known = !this.droppedUnknown
 
    let latencyBasis = null
    if (total) {
      if (this.latencyFromCapture === total) latencyBasis = 'camera capture'
      else if (this.latencyFromCapture === 0) latencyBasis = 'frame callback'
      else latencyBasis = 'mixed'
    }
 
    return {
      frames: total,
      seconds: round(seconds),
      // FPS = Frames / Seconds, as defined in the paper, plus the slowest and fastest second.
      fps: {
        overall: total && seconds ? round(total / seconds) : null,
        minSecond: this.fpsWindows.length ? round(Math.min(...this.fpsWindows)) : null,
        maxSecond: this.fpsWindows.length ? round(Math.max(...this.fpsWindows)) : null,
      },
      inferenceMs: stats(this.inference),
      processMs: stats(this.process),
      latencyMs: stats(this.latency),
      latencyBasis,
      overBudgetPct: total ? round((100 * this.overBudget) / total) : null,
      droppedFrames: known ? this.dropped : null,
      droppedPct: known && total ? round((100 * this.dropped) / (total + this.dropped)) : null,
      noPosePct: total ? round((100 * this.noPose) / total) : null,
      warmupFramesIgnored: Math.min(this.seen, this.warmupFrames),
    }
  }
}