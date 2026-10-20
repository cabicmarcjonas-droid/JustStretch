import { useEffect, useRef } from 'react'
import Icon from '../components/Icon.jsx'
import { areaLandmarks, highlightsHands } from '../lib/enums.js'
import { btn } from '../lib/ui.js'
import { initPoseTracker } from './poseTracker.js'

const tile = 'relative aspect-video overflow-hidden rounded-3xl bg-slate-900 shadow-card'
// Slightly smaller on phones so Start, End session and the timer share one row.
const stageButton = 'h-11 px-4 text-sm sm:h-12 sm:px-6 sm:text-base'
const tileLabel =
  'absolute left-3 top-3 z-10 rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm'

// Camera half of the session page, laid out as a mirror: the reference tile (passed in as
// `reference`) beside the camera tile on desktop, stacked like a video call on phones.
// The tracker draws to the canvas and updates the DOM refs below directly, so this
// component holds no state and never re-renders per frame. `stopButtonRef` lets the page
// check whether a session is running (the tracker enables Stop only while it is).
export default function PoseStage({ videoUrl, targetArea, reference, stopButtonRef, children }) {
  const video = useRef(null)
  const canvas = useRef(null)
  const overlay = useRef(null)
  const startButton = useRef(null)
  const ownStopButton = useRef(null)
  const stopButton = stopButtonRef ?? ownStopButton
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
    // stopButton is a ref object and never changes identity for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, targetArea])

  return (
    <section className="min-w-0 space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={tile}>
          <span className={tileLabel}>Reference</span>
          {reference}
        </div>

        <div className={tile}>
          <span className={tileLabel}>You</span>
          <video ref={video} className="hidden" playsInline muted />
          {/* The camera frame is 4:3; cover keeps the tile 16:9 like the reference. */}
          <canvas ref={canvas} width="640" height="480" className="block h-full w-full -scale-x-100 object-cover" />

          <div
            ref={overlay}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/75 px-6 text-center text-white/85"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Icon name="camera" className="h-6 w-6" />
            </span>
            <p className="text-sm">
              Camera is off. Press <strong className="text-white">Start</strong> to begin.
            </p>
          </div>

          {/* Live results: filled in by poseTracker.js while a session is running */}
          <div
            ref={livePanel}
            className="absolute bottom-3 right-3 z-10 hidden max-h-[calc(100%-1.5rem)] w-64 overflow-y-auto rounded-2xl bg-white/95 p-3.5 text-ink shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live form</h2>
                <p ref={liveFrames} className="text-[11px] text-slate-500" />
              </div>
              <span ref={liveScore} className="text-3xl font-black italic tracking-tighter tabular-nums text-accent">
                —
              </span>
            </div>
            <p ref={liveNote} className="mt-1.5 text-[11px] leading-snug text-slate-500" />
            <table ref={liveTable} className="mt-2 w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-1 text-left font-bold">Joint</th>
                  <th className="px-1 py-1 text-right font-bold">You</th>
                  <th className="px-1 py-1 text-right font-bold">Target</th>
                  <th className="px-1 py-1 text-right font-bold">Off</th>
                  <th className="py-1 pl-1">
                    <span className="sr-only">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody ref={liveRows} className="divide-y divide-slate-200" />
            </table>
          </div>
        </div>
      </div>

      {children}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-300 bg-white p-3 shadow-card">
        {/* Text-only buttons: the tracker rewrites Start's label to "Restart". */}
        <button ref={startButton} type="button" disabled className={`${btn.primary} ${stageButton} sm:min-w-28`}>
          Start
        </button>
        <button ref={stopButton} type="button" disabled className={`${btn.secondary} ${stageButton}`}>
          End session
        </button>
        <p
          ref={status}
          role="status"
          aria-live="polite"
          data-tone="muted"
          className="order-last min-w-0 basis-full text-sm sm:order-none sm:flex-1 sm:basis-48 text-slate-500 data-[tone=error]:text-red-700 data-[tone=ok]:text-accent data-[tone=warn]:text-amber-700"
        >
          Loading pose model…
        </p>
        <span className="ms-auto inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm sm:ms-0">
          <Icon name="clock" className="h-4 w-4 text-slate-500" />
          <span ref={timer} className="font-black tabular-nums">
            00:00
          </span>
        </span>
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-500">
        <Icon name="lock" className="h-4 w-4 shrink-0" />
        Pose tracking runs only in this browser tab. No video frames or body landmarks are sent to the server. Only your score, the session
        length and any notes are saved.
      </p>
    </section>
  )
}
