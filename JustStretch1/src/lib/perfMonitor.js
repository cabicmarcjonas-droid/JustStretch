// src/lib/perfMonitor.js
//
// Collects the numbers from Table 6 / Table 7 of the paper while a session runs:
//   FPS, frame processing time, latency (capture -> overlay drawn), dropped frames
//   and the share of frames where no pose was found.
//
// The tracker calls record() once per processed frame and summary() when the session ends.
// Open the session page with ?perf in the URL to also see a line per second in the console.
//
// Every frame is also kept as a row (frame ID, camera frame number, timings), so a trial
// can be exported with exportLog() / framesCsv() for the results chapter, and the Test
// Case 2 delay checks (out-of-order frames, frames dropped during an injected delay,
// recovery below the latency target) are worked out from those rows.
 
const round = (n, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits

// Table 7 target: latency under 100 ms. Used to decide when a frame has recovered
// after an injected delay.
export const LATENCY_TARGET_MS = 100

// Column order of the CSV export.
const CSV_COLUMNS = [
  'frameId',
  'sourceFrame',
  'tMs',
  'inferenceMs',
  'processMs',
  'latencyMs',
  'fromCapture',
  'poseFound',
  'dropped',
  'injectedMs',
  'warmup',
]
 
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
 
// The per-frame rows as CSV, one line per frame.
export function framesToCsv(rows) {
  const lines = [CSV_COLUMNS.join(',')]
  for (const row of rows) {
    lines.push(CSV_COLUMNS.map((key) => (row[key] === null || row[key] === undefined ? '' : String(row[key]))).join(','))
  }
  return `${lines.join('\n')}\n`
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
    // Per-frame rows for the export, warm-up frames included (marked).
    this.rows = []
    this.firstAt = null
    this.lastFrameId = null
    this.lastSourceFrame = null
    this.outOfOrder = 0
    this.injections = [] // one entry per injected delay, filled in by the frames after it
    this.openInjections = [] // injections still waiting for their latency to recover
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
   * @param {number} [sample.frameId]    Sequential ID of the processed frame (1, 2, 3...).
   * @param {number|null} [sample.sourceFrame] The camera's own frame number, when the browser
   *                                     reports one (requestVideoFrameCallback presentedFrames).
   * @param {number} [sample.injectedMs] Synthetic delay added to this frame (Test Case 2), or 0.
   */
  record({
    inferenceMs,
    processMs,
    latencyMs,
    fromCapture,
    poseFound,
    dropped,
    now = performance.now(),
    frameId = this.seen + 1,
    sourceFrame = null,
    injectedMs = 0,
  }) {
    this.seen += 1
    const warmup = this.seen <= this.warmupFrames
    this.trackFrame({ frameId, sourceFrame, inferenceMs, processMs, latencyMs, fromCapture, poseFound, dropped, injectedMs, warmup, now })
    if (warmup) return
 
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
 
  // Frame IDs, the export row and the Test Case 2 bookkeeping. Runs for warm-up frames too,
  // so an injected delay is never missed.
  trackFrame({ frameId, sourceFrame, inferenceMs, processMs, latencyMs, fromCapture, poseFound, dropped, injectedMs, warmup, now }) {
    if (this.firstAt === null) this.firstAt = now

    // A result is out of order if its frame is not newer than the one drawn before it.
    const olderId = this.lastFrameId !== null && frameId <= this.lastFrameId
    const olderSource = sourceFrame !== null && this.lastSourceFrame !== null && sourceFrame <= this.lastSourceFrame
    if (olderId || olderSource) this.outOfOrder += 1
    this.lastFrameId = frameId
    if (sourceFrame !== null) this.lastSourceFrame = sourceFrame

    if (this.rows.length < this.maxSamples) {
      this.rows.push({
        frameId,
        sourceFrame,
        tMs: round(now - this.firstAt),
        inferenceMs: round(inferenceMs, 2),
        processMs: round(processMs, 2),
        latencyMs: round(latencyMs, 2),
        fromCapture: Boolean(fromCapture),
        poseFound: Boolean(poseFound),
        dropped: dropped ?? null,
        injectedMs: round(injectedMs, 1),
        warmup,
      })
    }

    // Frames after an injected delay: the first one reports how many camera frames were
    // skipped while the delay ran, and the first one back under the latency target closes it.
    for (const open of this.openInjections) {
      if (open.nextFrameId === null) {
        open.nextFrameId = frameId
        open.droppedAfter = dropped ?? null
        open.nextLatencyMs = round(latencyMs)
      }
      open.framesAfter += 1
      if (latencyMs < LATENCY_TARGET_MS && open.framesToRecover === null) open.framesToRecover = open.framesAfter
    }
    this.openInjections = this.openInjections.filter((open) => open.framesToRecover === null)

    if (injectedMs > 0) {
      const entry = {
        frameId,
        sourceFrame,
        injectedMs: round(injectedMs),
        processMs: round(processMs),
        latencyMs: round(latencyMs),
        nextFrameId: null,
        droppedAfter: null,
        nextLatencyMs: null,
        framesAfter: 0,
        framesToRecover: null,
      }
      this.injections.push(entry)
      this.openInjections.push(entry)
    }
  }

  // Test Case 2 results: one line per injected delay.
  delayTest() {
    return this.injections.map(({ framesAfter, ...entry }) => ({
      ...entry,
      // Recovered = some later frame got back under the latency target.
      recovered: entry.framesToRecover !== null,
      framesObserved: framesAfter,
    }))
  }

  // Everything about this run, for the "Download log" button.
  exportLog(meta = {}) {
    return {
      meta: { exportedAt: new Date().toISOString(), budgetMs: this.budgetMs, latencyTargetMs: LATENCY_TARGET_MS, ...meta },
      summary: this.summary(),
      delayTest: this.delayTest(),
      frames: this.rows,
    }
  }

  framesCsv() {
    return framesToCsv(this.rows)
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
      // Test Case 2: results drawn from a frame no newer than the previous one (should be 0),
      // and how many synthetic delays were injected.
      outOfOrderFrames: this.outOfOrder,
      injectedDelays: this.injections.length,
      framesLogged: this.rows.length,
    }
  }
}