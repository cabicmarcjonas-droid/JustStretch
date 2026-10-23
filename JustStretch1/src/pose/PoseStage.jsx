import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { areaLandmarks, highlightsHands } from '../lib/enums.js'
import { btn } from '../lib/ui.js'
import { initPoseTracker } from './poseTracker.js'

const tile = 'relative aspect-video overflow-hidden rounded-lg border border-line bg-ink'
// Slightly smaller on phones so Start, End session and the timer share one row.
const stageButton = 'h-10 px-4 text-sm sm:h-11 sm:px-5'
const tileLabel =
  'absolute left-3 top-3 z-10 rounded-sm bg-ink/80 px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-white'

// Two layouts, switched with CSS only (the section's data-layout attribute), so the reference
// video and the tracker's DOM refs stay mounted and nothing restarts when you switch:
//   split  reference video | camera, the live form panel under the controls
//   focus  big camera | live form panel, the reference video minimised in the camera's bottom-right corner
const LAYOUT_KEY = 'juststretch.layout'
const readLayout = () => {
  try {
    return window.localStorage.getItem(LAYOUT_KEY) === 'focus' ? 'focus' : 'split'
  } catch {
    return 'split'
  }
}
// Class names are written out in full so Tailwind can find them.
const referenceMinimised =
  'group-data-[layout=focus]:absolute group-data-[layout=focus]:bottom-3 group-data-[layout=focus]:right-3 group-data-[layout=focus]:z-20 group-data-[layout=focus]:w-[32%] group-data-[layout=focus]:min-w-36 group-data-[layout=focus]:rounded-md group-data-[layout=focus]:ring-2 group-data-[layout=focus]:ring-white/80'
const segment = (active) =>
  `h-8 px-3 text-xs font-medium transition-colors first:border-r first:border-line ${
    active ? 'bg-ink text-white' : 'bg-surface text-ink-2 hover:bg-paper-2'
  }`

// Camera half of the session page, laid out as a mirror: the reference tile (passed in as
// `reference`) beside the camera tile on desktop, stacked like a video call on phones.
// The tracker draws to the canvas and updates the DOM refs below directly, so this
// component holds no state and never re-renders per frame. `stopButtonRef` lets the page
// check whether a session is running (the tracker enables Stop only while it is).
export default function PoseStage({
  videoUrl,
  targetArea,
  reference,
  stopButtonRef,
  children,
  durationMinutes,
  sets = 1,
  repsPerSet = 1,
}) {
  const [layout, setLayout] = useState(readLayout)
  const chooseLayout = (next) => {
    setLayout(next)
    try {
      window.localStorage.setItem(LAYOUT_KEY, next)
    } catch {
      // Storage blocked: the choice just won't be remembered.
    }
  }

  const video = useRef(null)
  const canvas = useRef(null)
  const overlay = useRef(null)
  const startButton = useRef(null)
  const ownStopButton = useRef(null)
  const soundButton = useRef(null)
  const stopButton = stopButtonRef ?? ownStopButton
  const timer = useRef(null)
  const setRep = useRef(null)
  const status = useRef(null)
  const livePanel = useRef(null)
  const liveScore = useRef(null)
  const liveFrames = useRef(null)
  const liveNote = useRef(null)
  const liveTable = useRef(null)
  const liveRows = useRef(null)
  const cameraWarning = useRef(null)
  const cameraWarningText = useRef(null)
  const retryButton = useRef(null)
  const endSessionButton = useRef(null)

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
        soundButton: soundButton.current,
        timer: timer.current,
        setRep: setRep.current,
        status: status.current,
        livePanel: livePanel.current,
        liveScore: liveScore.current,
        liveFrames: liveFrames.current,
        liveNote: liveNote.current,
        liveTable: liveTable.current,
        liveRows: liveRows.current,
        cameraWarning: cameraWarning.current,
        cameraWarningText: cameraWarningText.current,
        retryButton: retryButton.current,
        endSessionButton: endSessionButton.current,
      },
      { videoUrl, landmarks: areaLandmarks(targetArea), highlightHands: highlightsHands(targetArea), durationMinutes, sets, repsPerSet },
    )
    // stopButton is a ref object and never changes identity for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, targetArea, durationMinutes, sets, repsPerSet])

  return (
    <section
      data-layout={layout}
      className="group grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:data-[layout=focus]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
    >
      <div className="col-span-full flex items-center justify-end gap-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-muted">Layout</span>
        <div role="group" aria-label="Session layout" className="inline-flex overflow-hidden rounded-md border border-line">
          <button type="button" aria-pressed={layout === 'split'} onClick={() => chooseLayout('split')} className={segment(layout === 'split')}>
            Video + camera
          </button>
          <button type="button" aria-pressed={layout === 'focus'} onClick={() => chooseLayout('focus')} className={segment(layout === 'focus')}>
            Camera + feedback
          </button>
        </div>
      </div>

      <div className="relative col-span-full grid gap-4 lg:grid-cols-2 lg:group-data-[layout=focus]:col-span-1 lg:group-data-[layout=focus]:row-start-1 lg:group-data-[layout=focus]:grid-cols-1 lg:group-data-[layout=focus]:self-start">
        <div className={`${tile} ${referenceMinimised}`}>
          <span className={`${tileLabel} group-data-[layout=focus]:hidden`}>Reference</span>
          {reference}
        </div>

        <div className={tile}>
          <span className={tileLabel}>You</span>
          <video ref={video} className="hidden" playsInline muted />
          {/* The camera frame is 4:3; cover keeps the tile 16:9 like the reference. */}
          <canvas ref={canvas} width="640" height="480" className="block h-full w-full -scale-x-100 object-cover" />

          <div
            ref={overlay}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/80 px-6 text-center text-white/85"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/10">
              <Icon name="camera" className="h-6 w-6" />
            </span>
            <p className="text-sm">
              Camera is off. Press <strong className="text-white">Start</strong>, then stand about two metres back so you are
              visible from head to hips.
            </p>
          </div>

          <div
            ref={cameraWarning}
            role="alert"
            aria-live="assertive"
            className="absolute inset-0 z-10 hidden flex-col items-center justify-center gap-4 bg-ink/90 px-6 text-center text-white"
          >
            <svg className="h-10 w-10 text-[#f2b65c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.34 3.94l-7.5 13A1.5 1.5 0 004.14 19.5h15.72a1.5 1.5 0 001.3-2.56l-7.5-13a1.5 1.5 0 00-2.6 0z"
              />
            </svg>
            <p ref={cameraWarningText} className="max-w-sm text-sm font-medium">
              Camera disconnected. Check your webcam and try again.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                ref={retryButton}
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-ink hover:bg-paper-2 disabled:opacity-60"
              >
                Retry camera
              </button>
              <button
                ref={endSessionButton}
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/40 px-4 text-sm font-medium text-white hover:bg-white/10"
              >
                End session
              </button>
            </div>
            <p className="text-xs text-white/70">Your progress is kept while the camera is paused.</p>
          </div>
        </div>
      </div>

      <div className="col-span-full min-w-0 empty:hidden">{children}</div>

      <div className="col-span-full flex flex-wrap items-center gap-2.5 rounded-lg border border-line bg-surface p-3">
        {/* Text-only buttons: the tracker rewrites Start's label to "Restart". */}
        <button ref={startButton} type="button" disabled className={`${btn.primary} ${stageButton} sm:min-w-28`}>
          Start
        </button>
        <button ref={stopButton} type="button" disabled className={`${btn.secondary} ${stageButton}`}>
          End session
        </button>
        {/* Spoken cues. The tracker sets the label ("Sound on" / "Sound off") and hides this
            button when the browser has no speech synthesis. */}
        <button ref={soundButton} type="button" aria-pressed="true" className={`${btn.secondary} ${stageButton}`}>
          Sound on
        </button>
        <p
          ref={status}
          role="status"
          aria-live="polite"
          data-tone="muted"
          className="order-last min-w-0 basis-full text-sm sm:order-none sm:flex-1 sm:basis-48 text-muted data-[tone=error]:text-danger data-[tone=ok]:text-accent data-[tone=warn]:text-caution"
        >
          Loading pose model…
        </p>
        <span className="ms-auto inline-flex h-10 items-center gap-2 rounded-md bg-paper-2 px-3.5 text-sm sm:ms-0">
          <Icon name="clock" className="h-4 w-4 text-muted" />
          <span ref={timer} className="font-mono font-medium tabular-nums">
            00:00
          </span>
        </span>
        <span
          ref={setRep}
          className="hidden h-10 items-center rounded-md border border-line bg-surface px-3.5 font-mono text-sm font-medium tabular-nums"
        />
      </div>

      {/* Live results: filled in by poseTracker.js while a session is running. It sits below the
          controls rather than over the camera, so it never covers the user. The tracker only
          toggles `hidden` on the outer element, so the grid lives on the inner one. */}
      <div
        ref={livePanel}
        className="col-span-full hidden rounded-lg border border-line bg-surface p-5 lg:group-data-[layout=focus]:col-span-1 lg:group-data-[layout=focus]:col-start-2 lg:group-data-[layout=focus]:row-start-1 lg:group-data-[layout=focus]:self-start"
      >
        <div className="grid gap-5 md:grid-cols-[220px_1fr] lg:group-data-[layout=focus]:grid-cols-1">
          <div>
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-muted">Live form score</h2>
            <span ref={liveScore} className="mt-1 block font-mono text-[44px] font-medium leading-none tabular-nums text-accent">
              —
            </span>
            <p ref={liveFrames} className="mt-2 font-mono text-xs text-muted" />
            <p ref={liveNote} className="mt-2 text-[13px] leading-snug text-ink-2" />
          </div>
          <div className="min-w-0 overflow-x-auto">
            <table ref={liveTable} className="w-full text-sm">
              <thead className="border-b border-line font-mono text-[11px] uppercase tracking-[0.04em] text-muted">
                <tr>
                  <th className="py-1 text-left font-medium">Joint</th>
                  <th className="px-2 py-1 text-right font-medium">You</th>
                  <th className="px-2 py-1 text-right font-medium">Target</th>
                  <th className="px-2 py-1 text-right font-medium">Off by</th>
                  <th className="py-1 pl-2">
                    <span className="sr-only">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody ref={liveRows} className="divide-y divide-line font-mono" />
            </table>
          </div>
        </div>
      </div>

      <p className="col-span-full flex items-start gap-2 text-xs text-muted">
        <Icon name="lock" className="h-4 w-4 shrink-0" />
        Pose tracking runs only in this browser tab. No video frames or body landmarks are sent to the server. Only your score, the session
        length and any notes are saved.
      </p>
    </section>
  )
}