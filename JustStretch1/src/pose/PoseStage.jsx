import { useEffect, useRef } from 'react'
import { areaLandmarks, highlightsHands } from '../lib/enums.js'
import { initPoseTracker } from './poseTracker.js'

// Camera panel of the session page. Same markup as sessions/create.blade.php.
// The tracker draws to the canvas and updates the DOM refs below directly, so this
// component holds no state and never re-renders per frame.
export default function PoseStage({ videoUrl, targetArea }) {
  const video = useRef(null)
  const canvas = useRef(null)
  const overlay = useRef(null)
  const startButton = useRef(null)
  const stopButton = useRef(null)
  const timer = useRef(null)
  const status = useRef(null)
  const livePanel = useRef(null)
  const liveScore = useRef(null)
  const liveFrames = useRef(null)
  const liveNote = useRef(null)
  const liveTable = useRef(null)
  const liveRows = useRef(null)

  useEffect(() => {
    // One tracker per mount. In StrictMode React runs this effect, cleans up, and runs it
    // again; destroy() stops the loop and camera and closes both landmarkers each time.
    return initPoseTracker(
      {
        video: video.current,
        canvas: canvas.current,
        overlay: overlay.current,
        startButton: startButton.current,
        stopButton: stopButton.current,
        timer: timer.current,
        status: status.current,
        livePanel: livePanel.current,
        liveScore: liveScore.current,
        liveFrames: liveFrames.current,
        liveNote: liveNote.current,
        liveTable: liveTable.current,
        liveRows: liveRows.current,
      },
      { videoUrl, landmarks: areaLandmarks(targetArea), highlightHands: highlightsHands(targetArea) },
    )
  }, [videoUrl, targetArea])

  return (
    <section className="order-1 lg:order-2 min-w-0">
      <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-slate-900 shadow-2xl shadow-slate-200">
        <video ref={video} className="hidden" playsInline muted />
        <canvas ref={canvas} width="640" height="480" className="block w-full h-auto aspect-[4/3] -scale-x-100" />

        <div
          ref={overlay}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white/80 bg-ink/70"
        >
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <p className="text-sm">
            Camera is off. Press <strong className="text-white">Start</strong> to begin.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          ref={startButton}
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start
        </button>
        <button
          ref={stopButton}
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-line bg-white text-sm font-bold hover:border-ink disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Stop
        </button>
        <span className="ms-auto inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-5 py-2 text-sm shadow-sm">
          <span className="text-muted">Elapsed</span>
          <span ref={timer} className="font-black tabular-nums">
            00:00
          </span>
        </span>
      </div>

      <p
        ref={status}
        role="status"
        aria-live="polite"
        data-tone="muted"
        className="mt-3 text-sm text-muted data-[tone=ok]:text-accent data-[tone=warn]:text-amber-700 data-[tone=error]:text-red-700"
      >
        Loading pose model…
      </p>

      {/* Live results: filled in by poseTracker.js while a session is running */}
      <div ref={livePanel} className="hidden mt-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold">Live form</h2>
            <p ref={liveFrames} className="text-xs text-muted" />
          </div>
          <span ref={liveScore} className="text-4xl tabular-nums text-accent font-black italic tracking-tighter">
            —
          </span>
        </div>
        <p ref={liveNote} className="mt-2 text-xs text-muted" />
        <table ref={liveTable} className="mt-3 w-full text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 text-left font-medium">Joint</th>
              <th className="py-1 px-2 text-right font-medium">You</th>
              <th className="py-1 px-2 text-right font-medium">Target</th>
              <th className="py-1 px-2 text-right font-medium">Off by</th>
              <th className="py-1 pl-2">
                <span className="sr-only">Status</span>
              </th>
            </tr>
          </thead>
          <tbody ref={liveRows} className="divide-y divide-line" />
        </table>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs text-muted">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        Privacy: pose tracking runs only in this browser tab. No video frames or body landmarks are sent to the server. Only your score,
        the session length and any notes are saved.
      </p>
    </section>
  )
}
