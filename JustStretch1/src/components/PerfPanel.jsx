import { apiTimings } from '../lib/api.js'
import { downloadText, logFileStem } from '../lib/download.js'
import { framesToCsv } from '../lib/perfMonitor.js'
import { btn } from '../lib/ui.js'

// ?perf mode only. The paper's Table 7 targets next to what this run measured, the
// Test Case 2 results when a delay was injected, and downloads of the full log.
//
// log:   perf.exportLog() from the tracker ({ meta, summary, delayTest, frames })
// saved: { sessionId, timing } after the session was saved, so the save's response
//        time (Table 6) can be shown and included in the download.

const fmt = (value, unit = '') => (value === null || value === undefined ? '—' : `${value}${unit}`)

function Row({ metric, target, value, pass }) {
  const tone = pass === null ? 'text-muted' : pass ? 'text-accent' : 'text-danger'
  return (
    <tr className="border-t border-line">
      <td className="py-2 pr-2">{metric}</td>
      <td className="py-2 px-2 text-muted">{target}</td>
      <td className="py-2 px-2 text-right font-semibold tabular-nums">{value}</td>
      <td className={`py-2 pl-2 text-right text-xs font-semibold ${tone}`}>{pass === null ? 'n/a' : pass ? 'Pass' : 'Miss'}</td>
    </tr>
  )
}

const check = (value, ok) => (value === null || value === undefined ? null : ok(value))

export default function PerfPanel({ log, saved, title }) {
  if (!log) return null
  const { summary, delayTest } = log
  const save = saved?.timing ?? null
  const fps = summary.fps?.overall ?? null

  const rows = [
    ['Latency (average)', '< 100 ms', fmt(summary.latencyMs?.avg, ' ms'), check(summary.latencyMs?.avg, (v) => v < 100)],
    ['Latency (95th percentile)', '< 100 ms', fmt(summary.latencyMs?.p95, ' ms'), check(summary.latencyMs?.p95, (v) => v < 100)],
    ['Frame processing (average)', '≤ 33 ms', fmt(summary.processMs?.avg, ' ms'), check(summary.processMs?.avg, (v) => v <= 33)],
    ['Frame processing (95th percentile)', '≤ 33 ms', fmt(summary.processMs?.p95, ' ms'), check(summary.processMs?.p95, (v) => v <= 33)],
    ['Throughput', '30 to 60 FPS', fmt(fps, ' FPS'), check(fps, (v) => v >= 30 && v <= 60)],
    ['Dropped frames', '< 5%', fmt(summary.droppedPct, '%'), check(summary.droppedPct, (v) => v < 5)],
    ['No pose detected (error rate)', '< 2%', fmt(summary.noPosePct, '%'), check(summary.noPosePct, (v) => v < 2)],
    ['Out-of-order frames', '0', fmt(summary.outOfOrderFrames), check(summary.outOfOrderFrames, (v) => v === 0)],
    [
      'Session save (response time)',
      '< 500 ms',
      save ? `${save.ms} ms${save.serverMs != null ? ` (server ${save.serverMs} ms)` : ''}` : 'Save to measure',
      save ? save.ms < 500 : null,
    ],
  ]

  const stem = logFileStem(title)
  const downloadJson = () => {
    const data = { ...log, api: { sessionId: saved?.sessionId ?? null, save, requests: apiTimings() } }
    downloadText(`${stem}-perf.json`, JSON.stringify(data, null, 2), 'application/json')
  }
  const downloadCsv = () => {
    downloadText(`${stem}-frames.csv`, framesToCsv(log.frames), 'text/csv')
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-6" aria-labelledby="perf-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="perf-title" className="font-semibold">
            Performance (test mode)
          </h3>
          <p className="text-sm text-muted">
            {summary.frames} frames over {summary.seconds} s, after skipping {summary.warmupFramesIgnored} warm-up frames. Latency is
            measured from {summary.latencyBasis ?? 'the frame callback'}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadJson} className={`${btn.secondary} ${btn.md}`}>
            Download log (JSON)
          </button>
          <button type="button" onClick={downloadCsv} className={`${btn.secondary} ${btn.md}`} disabled={!log.frames.length}>
            Download frames (CSV)
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 text-left font-semibold">Metric</th>
              <th className="py-1 px-2 text-left font-semibold">Target</th>
              <th className="py-1 px-2 text-right font-semibold">Measured</th>
              <th className="py-1 text-right font-semibold">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([metric, target, value, pass]) => (
              <Row key={metric} metric={metric} target={target} value={value} pass={pass} />
            ))}
          </tbody>
        </table>
      </div>

      {delayTest.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold">Test Case 2: injected delays</h4>
          <p className="text-sm text-muted">
            Frames the camera produced during a delay should be skipped (dropped), and latency should drop back under 100 ms.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1 text-left font-semibold">Delayed frame</th>
                  <th className="py-1 px-2 text-right font-semibold">Delay</th>
                  <th className="py-1 px-2 text-right font-semibold">Skipped during it</th>
                  <th className="py-1 px-2 text-right font-semibold">Next frame</th>
                  <th className="py-1 px-2 text-right font-semibold">Next latency</th>
                  <th className="py-1 text-right font-semibold">Frames to recover</th>
                </tr>
              </thead>
              <tbody>
                {delayTest.map((entry) => (
                  <tr key={entry.frameId} className="border-t border-line tabular-nums">
                    <td className="py-2">
                      #{entry.frameId}
                      {entry.sourceFrame != null && <span className="text-muted"> (camera {entry.sourceFrame})</span>}
                    </td>
                    <td className="py-2 px-2 text-right">{entry.injectedMs} ms</td>
                    <td className="py-2 px-2 text-right">{fmt(entry.droppedAfter)}</td>
                    <td className="py-2 px-2 text-right">{entry.nextFrameId ? `#${entry.nextFrameId}` : '—'}</td>
                    <td className="py-2 px-2 text-right">{fmt(entry.nextLatencyMs, ' ms')}</td>
                    <td className={`py-2 text-right font-semibold ${entry.recovered ? 'text-accent' : 'text-danger'}`}>
                      {entry.recovered ? entry.framesToRecover : 'Not yet'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
