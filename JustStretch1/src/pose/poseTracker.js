/**
 * Live pose and hand tracking for the stretch session page.
 *
 * Runs MediaPipe PoseLandmarker (33 body points) and HandLandmarker (21 points
 * per hand, i.e. every finger joint) entirely in the browser: camera frames and
 * landmarks never leave the device. When the user presses Stop, or the exercise
 * duration is reached, the elapsed time and results are emitted once as a
 * `session-ended` event on the client event bus for the score form.
 *
 * Port of laravel/resources/js/pose-tracker.js. Behaviour is unchanged; the
 * differences are plumbing: elements arrive as refs instead of being looked up
 * by id, the function returns destroy() for React's effect cleanup, and async
 * work that finishes after destroy() is discarded (and its models closed).
 * All per-frame work writes straight to the canvas and DOM refs, never to React state.
 */
import { DrawingUtils, FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision'
import { AudioCoach } from '../lib/audioCoach.js'
import { DelayInjector, parseDelayOptions } from '../lib/delayInjector.js'
import { emit } from '../lib/eventBus.js'
import { PerfMonitor } from '../lib/perfMonitor.js'
import {
  SessionScorer,
  compareToReference,
  computeUserAngles,
  jointLandmarkIndex,
  loadReference,
  poseUrlFromVideo,
} from '../lib/poseComparison.js'

// Must match the exact version in package.json so the JS and wasm agree.
const MEDIAPIPE_VERSION = '1.0.1'
const WASM_PATH = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

// Pose landmarks 17–22 are the pose model's rough pinky/index/thumb points.
// When the hand model sees a hand, its 21-point skeleton replaces them.
const POSE_HAND_POINTS = new Set([17, 18, 19, 20, 21, 22])

const ACCENT = '#059669'
const MUTED_LINE = 'rgba(228, 228, 223, 0.85)'
const MUTED_POINT = 'rgba(107, 111, 105, 0.9)'
const OFF_COLOR = '#dc2626'
const NEUTRAL_DOT = '#d4d4d0'

// A session needs at least this many judged frames before a camera score is suggested.
const MIN_JUDGED_FRAMES = 30

// The live results panel is refreshed at most 4 times a second so DOM work never
// competes with pose inference.
const LIVE_PANEL_INTERVAL_MS = 250

// Per-frame budget from the paper: 33 ms per frame keeps 30 FPS.
const FRAME_BUDGET_MS = 33

// The hand model costs about as much as the pose model, and the finger skeleton is mostly
// cosmetic, so it does not run on every frame; the last result is reused in between.
// Exercises that target the hands run it every frame, everything else every 2nd frame.
// If the device cannot stay inside the frame budget, the interval grows (never shrinks
// again within the same session, so it cannot flip back and forth).
const HAND_INTERVAL_BASE = 2
const HAND_INTERVAL_BASE_HANDS = 1
const HAND_INTERVAL_MAX = 6
const HAND_INTERVAL_MAX_HANDS = 3
const BACKOFF_CHECK_EVERY = 30 // frames
const BACKOFF_WARMUP = 60 // frames, so the slow first inferences don't trigger a back-off

// Same threshold computeUserAngles uses, so "not visible" means the same thing everywhere.
const MIN_VISIBILITY = 0.6
// About a third of a second at 30 FPS before the step-back message appears.
const UNSEEN_FRAMES_BEFORE_PROMPT = 10

/**
 * @param {object} els   Element refs: video, canvas, overlay, startButton, stopButton, timer,
 *                       setRep, status, livePanel, liveScore, liveFrames, liveNote, liveTable,
 *                       liveRows, cameraWarning, cameraWarningText, retryButton, endSessionButton.
 * @param {object} options { videoUrl, landmarks, highlightHands, durationMinutes, sets, repsPerSet }
 * @returns {() => void} destroy: stops the loop, the camera and the timer, and closes both models.
 */
export function initPoseTracker(els, { videoUrl, landmarks = [], highlightHands = false, durationMinutes = 0, sets = 1, repsPerSet = 1 }) {
  const {
    video,
    canvas,
    overlay,
    startButton,
    stopButton,
    timer: timerEl,
    setRep: setRepEl,
    status: statusEl,
    livePanel,
    liveScore: liveScoreEl,
    liveFrames: liveFramesEl,
    liveNote: liveNoteEl,
    liveTable,
    liveRows: liveRowsEl,
    cameraWarning,
    cameraWarningText,
    retryButton,
    endSessionButton,
    soundButton,
  } = els

  // The video frame covers the whole canvas, so the canvas needs no alpha channel
  // and no clearRect before each frame.
  const ctx = canvas.getContext('2d', { alpha: false })
  const drawingUtils = new DrawingUtils(ctx)
  const highlighted = new Set(landmarks)
  const highlightedConnections = PoseLandmarker.POSE_CONNECTIONS.filter(
    ({ start, end }) => highlighted.has(start) && highlighted.has(end),
  )
  const bodyOnlyConnections = PoseLandmarker.POSE_CONNECTIONS.filter(
    ({ start, end }) => !POSE_HAND_POINTS.has(start) && !POSE_HAND_POINTS.has(end),
  )
  // Same filter as above for the highlighted joints, done once instead of on every frame.
  const highlightedBodyOnlyConnections = highlightedConnections.filter(
    ({ start, end }) => !POSE_HAND_POINTS.has(start) && !POSE_HAND_POINTS.has(end),
  )

  const baseHandInterval = highlightHands ? HAND_INTERVAL_BASE_HANDS : HAND_INTERVAL_BASE
  const maxHandInterval = highlightHands ? HAND_INTERVAL_MAX_HANDS : HAND_INTERVAL_MAX

  // ?perf in the URL prints one console line per second and exposes window.__justStretchPerf.
  const perfLog = new URLSearchParams(window.location.search).has('perf')
  const perf = new PerfMonitor({ budgetMs: FRAME_BUDGET_MS, log: perfLog })
  if (perfLog) window.__justStretchPerf = perf

  // Test tools for the paper, only with ?perf:
  //   &delay=100   Test Case 2 synthetic delay (see lib/delayInjector.js for the options)
  //   &trial=60    stop the session by itself after 60 seconds, for timed trials
  const delay = new DelayInjector(perfLog ? parseDelayOptions() : null)
  const trialSeconds = perfLog ? Math.max(0, Number.parseInt(new URLSearchParams(window.location.search).get('trial'), 10) || 0) : 0
  let trialId = null

  // Landmarks that must be in view for the stretch to be judged. The pose model's rough
  // hand points (17-22) are left out because their visibility is low even when you are in
  // frame. Falls back to shoulders and hips when nothing else is highlighted.
  const trackedPoints = [...highlighted].filter((index) => !POSE_HAND_POINTS.has(index))
  const requiredPoints = trackedPoints.length ? trackedPoints : [11, 12, 23, 24]
  const targetsInFrame = (pose) =>
    requiredPoints.every((index) => {
      const p = pose[index]
      return p && (p.visibility ?? 1) >= MIN_VISIBILITY && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1
    })

  // "left_elbow" -> "left elbow", for the spoken cue.
  const spokenName = (name) => name.replace(/_/g, ' ')
  const worstJointName = (result) => {
    let worst = null
    for (const [name, joint] of Object.entries(result.perJoint)) {
      if (!joint.ok && (!worst || joint.errorDeg > worst.errorDeg)) worst = { name, errorDeg: joint.errorDeg }
    }
    return worst ? spokenName(worst.name) : null
  }

  // Spoken cues (Web Speech API, no audio files). The coach decides what is worth saying.
  const coach = new AudioCoach()
  const refreshSoundButton = () => {
    if (!soundButton) return
    soundButton.hidden = !coach.supported
    soundButton.textContent = coach.enabled ? 'Sound on' : 'Sound off'
    soundButton.setAttribute('aria-pressed', String(coach.enabled))
  }
  const toggleSound = () => {
    coach.setEnabled(!coach.enabled)
    coach.unlock() // this click is a user gesture, so speech is allowed from here on
    refreshSoundButton()
  }
  refreshSoundButton()

  let destroyed = false
  let landmarker = null
  let handLandmarker = null
  let stream = null
  let frameId = null // requestAnimationFrame handle (fallback loop)
  let vfcId = null // requestVideoFrameCallback handle (preferred loop)
  let vfcSeen = 0
  let watchdogId = null
  let lastPresented = null
  let timerId = null
  let startedAt = null
  let lastVideoTime = -1
  let trackHandlers = []
  let stallTimer = null

  // Session state. `pausedAt` freezes the clock while the camera is disconnected;
  // `sessionEnded` makes the end-of-session flow (and its event) fire exactly once.
  let pausedAt = null
  let pausedByCamera = false
  let sessionEnded = false
  let retrying = false
  const targetSeconds = Math.max(0, Math.round(Number(durationMinutes) * 60)) || 0
  // Timed holds: durationMinutes is divided evenly into sets × reps. `repSeconds`
  // is only used for the progress label; completion is still the full duration.
  const totalSets = Math.max(1, Math.round(Number(sets) || 1))
  const totalRepsPerSet = Math.max(1, Math.round(Number(repsPerSet) || 1))
  const totalReps = totalSets * totalRepsPerSet
  const repSeconds = targetSeconds > 0 ? targetSeconds / totalReps : 0
  let sessionKey = null
  const newSessionKey = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const CAMERA_LOST_MESSAGE = 'Camera disconnected. Check your webcam and try again.'

  // How many reps/sets have been completed at `seconds`, clamped to the plan.
  const progressAt = (seconds) => {
    const repsDone = repSeconds > 0 ? Math.min(totalReps, Math.floor(seconds / repSeconds)) : 0
    const finished = repsDone >= totalReps
    return {
      repsDone,
      setsDone: Math.min(totalSets, Math.floor(repsDone / totalRepsPerSet)),
      set: finished ? totalSets : Math.min(totalSets, Math.floor(repsDone / totalRepsPerSet) + 1),
      rep: finished ? totalRepsPerSet : (repsDone % totalRepsPerSet) + 1,
      finished,
    }
  }

  const updateProgress = (seconds) => {
    if (!setRepEl) return
    const show = totalReps > 1
    setRepEl.classList.toggle('hidden', !show)
    setRepEl.classList.toggle('inline-flex', show)
    if (!show) return
    const { repsDone, set, rep, finished } = progressAt(seconds)
    setRepEl.textContent =
      finished && targetSeconds && seconds >= targetSeconds
        ? `All ${totalSets} ${totalSets === 1 ? 'set' : 'sets'} complete`
        : `Set ${set} of ${totalSets} · Rep ${rep} of ${totalRepsPerSet} (${repsDone}/${totalReps})`
  }

  let frameCount = 0
  let unseenFrames = 0
  let handInterval = baseHandInterval
  let handCache = []

  // Blender reference pose for this exercise. Stays null when there is none,
  // in which case the page behaves exactly as before (manual slider only).
  let reference = null
  let scorer = new SessionScorer()
  let latest = null
  let smoothed = {}
  // Camera frames that reached us but produced no skeleton, so they could not be
  // judged. Used as the fallback when the browser cannot report dropped frames.
  let noPoseFrames = 0

  // Writing the same text to the DOM 30 times a second still costs layout work,
  // so the status line is only touched when it actually changes.
  let statusKey = ''
  const setStatus = (message, tone = 'muted') => {
    const key = `${tone}|${message}`
    if (key === statusKey) {
      return
    }
    statusKey = key
    statusEl.textContent = message
    statusEl.dataset.tone = tone
  }

  const formatElapsed = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const elapsedSeconds = () => {
    if (!startedAt) return 0
    const end = pausedAt ?? performance.now()
    return Math.round((end - startedAt) / 1000)
  }

  const tick = () => {
    if (!startedAt || pausedByCamera) return
    const elapsed = elapsedSeconds()
    if (targetSeconds && elapsed >= targetSeconds) {
      finish('complete')
      return
    }
    timerEl.textContent = formatElapsed(elapsed)
    updateProgress(elapsed)
  }

  const setRunning = (running) => {
    startButton.disabled = running || !landmarker
    stopButton.disabled = !running
    overlay.classList.toggle('hidden', running)
    overlay.classList.toggle('flex', !running)
    livePanel?.classList.toggle('hidden', !running)
  }

  // ---- Live results panel -------------------------------------------------
  let lastPanelUpdate = 0
  let liveRowsFor = null // the reference the table rows were built for
  let liveRows = {} // joint name -> { user, ref, error, dot } cells

  const jointLabel = (name) => {
    const text = name.replace(/_/g, ' ')
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  const cameraHint = (camera) => {
    if (camera === 'Cam_Side') return 'This stretch is tracked from the side: stand sideways to the camera.'
    if (camera === 'Cam_Front') return 'This stretch is tracked from the front: face the camera.'
    return ''
  }

  const buildLiveRows = () => {
    liveRowsEl.replaceChildren()
    liveRows = {}

    for (const name of reference.targetJoints) {
      const tr = document.createElement('tr')
      const cell = (className) => {
        const td = document.createElement('td')
        td.className = className
        tr.appendChild(td)
        return td
      }

      const label = cell('py-1.5 pr-2')
      label.textContent = jointLabel(name)
      const user = cell('py-1.5 px-2 text-right tabular-nums')
      const ref = cell('py-1.5 px-2 text-right tabular-nums')
      const error = cell('py-1.5 px-2 text-right tabular-nums font-medium')
      const dotCell = cell('py-1.5 pl-2 text-right')
      const dot = document.createElement('span')
      dot.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:9999px;background:${NEUTRAL_DOT}`
      dotCell.appendChild(dot)

      liveRows[name] = { user, ref, error, dot }
      liveRowsEl.appendChild(tr)
    }
  }

  const setLiveRow = (name, result) => {
    const row = liveRows[name]
    if (!row) {
      return
    }
    if (!result) {
      row.user.textContent = '—'
      row.ref.textContent = '—'
      row.error.textContent = '—'
      row.error.style.color = ''
      row.dot.style.background = NEUTRAL_DOT
      return
    }
    const color = result.ok ? ACCENT : OFF_COLOR
    row.user.textContent = `${Math.round(result.user)}°`
    row.ref.textContent = `${Math.round(result.ref)}°`
    row.error.textContent = `${Math.round(result.errorDeg)}°`
    row.error.style.color = color
    row.dot.style.background = color
  }

  const resetLivePanel = () => {
    lastPanelUpdate = 0
    liveRowsFor = null
    liveRowsEl?.replaceChildren()
    if (liveScoreEl) liveScoreEl.textContent = '—'
    if (liveFramesEl) liveFramesEl.textContent = ''
  }

  const updateLivePanel = (now) => {
    if (!livePanel || now - lastPanelUpdate < LIVE_PANEL_INTERVAL_MS) {
      return
    }
    lastPanelUpdate = now

    if (!reference) {
      liveTable.classList.add('hidden')
      liveScoreEl.textContent = '—'
      liveFramesEl.textContent = ''
      liveNoteEl.textContent =
        'This exercise has no reference pose yet, so there is nothing to score against. Tracking only.'
      return
    }

    if (liveRowsFor !== reference) {
      buildLiveRows()
      liveRowsFor = reference
    }
    liveTable.classList.remove('hidden')

    const { score, judgedFrames, goodFrames } = scorer.summary()
    liveScoreEl.textContent = score === null ? '—' : String(score)
    liveFramesEl.textContent = judgedFrames
      ? `${goodFrames} of ${judgedFrames} frames in range`
      : 'Waiting for a frame that can be judged…'
    liveNoteEl.textContent = [cameraHint(reference.camera), 'Green joints are within the margin of error.']
      .filter(Boolean)
      .join(' ')

    for (const name of reference.targetJoints) {
      setLiveRow(name, latest?.perJoint[name] ?? null)
    }
  }

  // 1. Load the models as soon as the page opens (camera is NOT requested yet).
  const withGpuFallback = async (create) => {
    try {
      return await create('GPU')
    } catch (gpuError) {
      // Some machines lack WebGL2 support; the CPU path is slower but works.
      console.warn('GPU delegate unavailable, falling back to CPU.', gpuError)
      return create('CPU')
    }
  }

  const closeModels = () => {
    landmarker?.close()
    handLandmarker?.close()
    landmarker = null
    handLandmarker = null
  }

  const loadModel = async () => {
    setStatus('Loading pose and hand models…')
    startButton.disabled = true

    const vision = await FilesetResolver.forVisionTasks(WASM_PATH).catch((error) => {
      console.error(error)
      return null
    })

    const [pose, hands] = await Promise.allSettled([
      vision &&
        withGpuFallback((delegate) =>
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate },
            runningMode: 'VIDEO',
            numPoses: 1,
          }),
        ),
      vision &&
        withGpuFallback((delegate) =>
          HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate },
            runningMode: 'VIDEO',
            numHands: 2,
          }),
        ),
    ])

    landmarker = pose.status === 'fulfilled' ? pose.value : null
    handLandmarker = hands.status === 'fulfilled' ? hands.value : null

    // The page was left (or React re-ran the effect) while the models were loading:
    // release what was just created instead of keeping it alive.
    if (destroyed) {
      closeModels()
      return
    }

    if (!landmarker) {
      console.error(pose.reason)
      setStatus('Could not load the pose model. Check your internet connection and reload the page.', 'error')
      return
    }

    if (!handLandmarker) {
      // Finger tracking is a bonus; the session still works with body tracking alone.
      console.warn('Hand model unavailable; tracking body only.', hands.reason)
      setStatus('Pose model ready (finger tracking unavailable). Press Start when you are in frame.')
    } else {
      setStatus('Pose and hand models ready. Press Start when you are in frame.')
    }

    startButton.disabled = false
  }

  const cameraErrorMessage = (error) => {
    switch (error?.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Camera permission was denied. Allow camera access in your browser settings and press Start again.'
      case 'NotFoundError':
      case 'DevicesNotFoundError':
      case 'OverconstrainedError':
        return 'No camera was found. Connect a webcam and press Start again.'
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Your camera is being used by another application. Close it and try again.'
      case 'SecurityError':
        return 'Camera access is blocked on this address. Open the app at http://localhost:5173 or http://127.0.0.1:5173.'
      default:
        return `Could not start the camera${error?.message ? `: ${error.message}` : '.'}`
    }
  }

  // 3–5. One camera frame: detect, draw the frame, the full skeleton, then the target joints.
  //   captureTime  when the camera captured the frame (performance.now() clock), if the browser says
  //   dropped      camera frames skipped since the last one we processed, or null if unknown
  //   sourceFrame  the camera's own frame number, or null if the browser does not report it
  const processFrame = (captureTime, dropped, sourceFrame = null) => {
    if (destroyed || !landmarker) {
      return
    }

    const t0 = performance.now()
    frameCount += 1
    // Test Case 2: holds this frame up when ?perf&delay=... picked it. 0 for every other frame.
    const injectedMs = delay.maybeDelay(frameCount)

    const pose = landmarker.detectForVideo(video, t0).landmarks?.[0]

    if (handLandmarker && frameCount % handInterval === 0) {
      handCache = handLandmarker.detectForVideo(video, t0).landmarks ?? []
    }
    const hands = handCache
    const handsFound = hands.length > 0
    // The camera gave us a frame but the pose model found nobody in it.
    if (!pose?.length) noPoseFrames += 1
    const tInference = performance.now()

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Compare the live pose with the Blender reference (only when one exists).
    latest = null
    if (reference && pose?.length) {
      const raw = computeUserAngles(pose, video.videoWidth, video.videoHeight, reference)
      const angles = {}
      for (const [name, value] of Object.entries(raw)) {
        if (value == null) {
          angles[name] = null
          delete smoothed[name]
          continue
        }
        smoothed[name] = smoothed[name] == null ? value : smoothed[name] + 0.4 * (value - smoothed[name])
        angles[name] = smoothed[name]
      }
      latest = compareToReference(angles, reference, (performance.now() - startedAt) / 1000)
      scorer.add(latest)
    }
    const tProcess = performance.now()

    updateLivePanel(tProcess)

    const inFrame = Boolean(pose?.length) && targetsInFrame(pose)
    unseenFrames = inFrame ? 0 : unseenFrames + 1

    if (unseenFrames >= UNSEEN_FRAMES_BEFORE_PROMPT) {
      setStatus(
        pose?.length
          ? 'Step back a little so your whole upper body is in frame.'
          : 'No body detected. Step back so the camera can see you.',
        'warn',
      )
    } else if (latest) {
      setStatus(
        latest.good ? 'Good form. Keep it up.' : 'Adjust your form: red joints are off the reference.',
        latest.good ? 'ok' : 'warn',
      )
    } else {
      setStatus('Tracking. Green joints are the ones this stretch targets.', 'ok')
    }

    coach.update({
      now: tProcess,
      inFrame,
      tracked: Boolean(latest),
      good: Boolean(latest?.good),
      worstJoint: latest && !latest.good ? worstJointName(latest) : null,
    })

    if (pose?.length) {
      // Skip the pose model's coarse hand points when real finger tracking is available.
      const showPoint = (index) => !(handsFound && POSE_HAND_POINTS.has(index))

      drawingUtils.drawConnectors(pose, handsFound ? bodyOnlyConnections : PoseLandmarker.POSE_CONNECTIONS, {
        color: MUTED_LINE,
        lineWidth: 2,
      })
      drawingUtils.drawLandmarks(
        pose.filter((_, index) => showPoint(index)),
        { color: MUTED_POINT, fillColor: MUTED_POINT, radius: 2, lineWidth: 1 },
      )

      drawingUtils.drawConnectors(pose, handsFound ? highlightedBodyOnlyConnections : highlightedConnections, {
        color: ACCENT,
        lineWidth: 5,
      })
      drawingUtils.drawLandmarks(
        pose.filter((_, index) => highlighted.has(index) && showPoint(index)),
        { color: '#ffffff', fillColor: ACCENT, radius: 7, lineWidth: 2 },
      )

      // Red dot on any joint that is outside the margin of error.
      if (latest) {
        const offJoints = Object.entries(latest.perJoint)
          .filter(([, result]) => !result.ok)
          .map(([name]) => jointLandmarkIndex(reference, name))
          .filter((index) => index !== null && showPoint(index))
        drawingUtils.drawLandmarks(
          offJoints.map((index) => pose[index]),
          { color: '#ffffff', fillColor: '#dc2626', radius: 8, lineWidth: 2 },
        )
      }
    }

    for (const hand of hands) {
      drawingUtils.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, {
        color: highlightHands ? ACCENT : MUTED_LINE,
        lineWidth: highlightHands ? 4 : 2,
      })
      drawingUtils.drawLandmarks(
        hand,
        highlightHands
          ? { color: '#ffffff', fillColor: ACCENT, radius: 4, lineWidth: 1.5 }
          : { color: MUTED_POINT, fillColor: MUTED_POINT, radius: 2, lineWidth: 1 },
      )
    }

    // Latency runs from the camera's capture time to the end of drawing. It stops there,
    // not at the screen: the browser still needs up to one display refresh to show it.
    // Without a usable capture time it starts at the beginning of this function instead.
    const tDone = performance.now()
    const age = tDone - captureTime
    const fromCapture = Number.isFinite(captureTime) && age >= 0 && age < 2000
    perf.record({
      inferenceMs: tInference - t0,
      processMs: tProcess - t0,
      latencyMs: fromCapture ? age : tDone - t0,
      fromCapture,
      poseFound: Boolean(pose?.length),
      dropped,
      now: tDone,
      frameId: frameCount,
      sourceFrame,
      injectedMs,
    })

    // Back off the hand model if this device cannot keep up with the frame budget.
    if (
      frameCount >= BACKOFF_WARMUP &&
      frameCount % BACKOFF_CHECK_EVERY === 0 &&
      handInterval < maxHandInterval &&
      perf.emaProcessMs > FRAME_BUDGET_MS * 0.9
    ) {
      handInterval += 1
      if (perfLog) console.info(`[perf] over budget, hand model now runs every ${handInterval} frames`)
    }
  }
  // ---- Camera status, pause and recovery -----------------------------------
  const showCameraWarning = (visible, message) => {
    if (!cameraWarning) return
    cameraWarning.classList.toggle('hidden', !visible)
    cameraWarning.classList.toggle('flex', visible)
    if (visible && message && cameraWarningText) cameraWarningText.textContent = message
  }

  const clearTrackHandlers = () => {
    for (const { track, type, handler } of trackHandlers) {
      track.removeEventListener(type, handler)
    }
    trackHandlers = []
  }

  // Preferred loop: the browser calls this once per new camera frame, so nothing is polled
  // and the metadata says when the frame was captured and how many frames were skipped.
  const onVideoFrame = (_now, metadata) => {
    if (destroyed || !landmarker) {
      return
    }
    vfcId = video.requestVideoFrameCallback(onVideoFrame)
    vfcSeen += 1

    let dropped = null
    if (typeof metadata.presentedFrames === 'number') {
      dropped = lastPresented === null ? 0 : Math.max(0, metadata.presentedFrames - lastPresented - 1)
      lastPresented = metadata.presentedFrames
    }
    processFrame(metadata.captureTime, dropped, typeof metadata.presentedFrames === 'number' ? metadata.presentedFrames : null)
  }

  // Fallback loop for browsers without requestVideoFrameCallback: poll on every display
  // refresh and skip refreshes where the camera has no new frame.
  const renderFrame = () => {
    if (destroyed || !landmarker) {
      return
    }
    frameId = requestAnimationFrame(renderFrame)

    if (video.readyState < 2 || video.currentTime === lastVideoTime) {
      return
    }
    lastVideoTime = video.currentTime
    processFrame(undefined, null)
  }

  const startLoop = () => {
    vfcSeen = 0
    lastPresented = null

    if (!('requestVideoFrameCallback' in video)) {
      frameId = requestAnimationFrame(renderFrame)
      return
    }

    vfcId = video.requestVideoFrameCallback(onVideoFrame)
    // Some browsers never call it for a hidden <video>. If it stays silent, poll instead.
    watchdogId = setTimeout(() => {
      if (vfcSeen === 0 && !destroyed && stream) {
        video.cancelVideoFrameCallback(vfcId)
        vfcId = null
        frameId = requestAnimationFrame(renderFrame)
      }
    }, 1500)
  }

  const stopTracks = () => {
    clearTrackHandlers()
    clearTimeout(stallTimer)
    stallTimer = null
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
    video.srcObject = null
  }
  const pauseForCamera = () => {
    if (startedAt == null || sessionEnded || pausedByCamera) return
    pausedByCamera = true
    pausedAt = performance.now()
    cancelAnimationFrame(frameId)
    if (vfcId !== null) video.cancelVideoFrameCallback?.(vfcId)
    clearTimeout(watchdogId)
    clearInterval(timerId)
    frameId = null
    vfcId = null
    watchdogId = null
    timerId = null
    clearTimeout(stallTimer)
    stallTimer = null
    showCameraWarning(true, CAMERA_LOST_MESSAGE)
    setStatus('Camera disconnected. Session paused.', 'error')
  }

  const resumeFromCamera = async () => {
    if (!pausedByCamera || destroyed || startedAt == null) return
    const track = stream?.getVideoTracks()[0]
    if (!track || track.readyState === 'ended') return

    try {
      await video.play()
    } catch {
      // The track is back but the element still cannot play; leave the warning up
      // so Retry or End session remains available.
      return
    }
    if (destroyed || !pausedByCamera) return

    if (pausedAt != null) {
      startedAt += performance.now() - pausedAt
      pausedAt = null
    }
    pausedByCamera = false
    lastVideoTime = -1
    showCameraWarning(false)
    timerEl.textContent = formatElapsed(elapsedSeconds())
    updateProgress(elapsedSeconds())
    timerId = setInterval(tick, 250)
    setRunning(true)
    setStatus('Camera reconnected. Session resumed.', 'ok')
    startLoop()
  }

  const handleCameraLost = (reason) => {
    if (destroyed || sessionEnded || startedAt == null) return
    // `mute` can fire while a retry is already replacing the stream.
    if (pausedByCamera) return
    if (reason === 'stalled') {
      showCameraWarning(true, 'Camera stopped responding. Check your webcam and press Retry.')
      setStatus('Camera stopped responding. Session paused.', 'error')
      pausedByCamera = true
      pausedAt = performance.now()
      cancelAnimationFrame(frameId)
      if (vfcId !== null) video.cancelVideoFrameCallback?.(vfcId)
      clearTimeout(watchdogId)
      clearInterval(timerId)
      frameId = null
      vfcId = null
      watchdogId = null
      timerId = null
      return
    }
    pauseForCamera()
  }

  const attachStream = (acquired) => {
    clearTrackHandlers()
    stream = acquired
    video.srcObject = acquired

    for (const track of acquired.getVideoTracks()) {
      const onEnded = () => handleCameraLost('ended')
      const onMute = () => handleCameraLost('mute')
      const onUnmute = () => {
        if (pausedByCamera) resumeFromCamera()
      }
      track.addEventListener('ended', onEnded)
      track.addEventListener('mute', onMute)
      track.addEventListener('unmute', onUnmute)
      trackHandlers.push(
        { track, type: 'ended', handler: onEnded },
        { track, type: 'mute', handler: onMute },
        { track, type: 'unmute', handler: onUnmute },
      )
    }
  }

  // Ends the loop and the timer, and releases the camera.
  const halt = () => {
    cancelAnimationFrame(frameId)
    if (vfcId !== null) video.cancelVideoFrameCallback?.(vfcId)
    clearTimeout(watchdogId)
    clearInterval(timerId)
    clearTimeout(trialId)
    trialId = null
    coach.stop()
    frameId = null
    vfcId = null
    watchdogId = null
    timerId = null
    stopTracks()
  }

  const finish = (reason = 'manual') => {
    if (sessionEnded || startedAt == null) return
    sessionEnded = true

    // Do not count the disconnected period in the saved duration.
    if (pausedAt != null) {
      startedAt += performance.now() - pausedAt
      pausedAt = null
    }
    pausedByCamera = false
    showCameraWarning(false)
    halt()

    const seconds = elapsedSeconds()
    startedAt = null

    timerEl.textContent = formatElapsed(seconds)
    updateProgress(seconds)
    setRunning(false)
    startButton.textContent = 'Restart'
    if (reason === 'complete') {
      setStatus('Session complete. Rate your form below to save it.', 'ok')
    } else if (reason === 'camera-lost') {
      setStatus('Camera disconnected. Session ended; your results so far are below.', 'error')
    } else {
      setStatus('Session stopped. Rate your form below to save it.')
    }

    // Suggested score (0-100) from the pose comparison. null when this exercise has no
    // reference or too few frames were judged (e.g. Start then Stop right away).
    const summary = scorer.summary()
    const { score, judgedFrames } = summary
    const suggested = reference && judgedFrames >= MIN_JUDGED_FRAMES ? score : null

    // Everything the results card needs. `joints` only lists joints that were judged at least once.
    const progress = progressAt(seconds)
    const perfSummary = perf.summary()
    if (perfLog) console.log('[perf] session summary', perfSummary)
    const detail = {
      sessionId: sessionKey,
      seconds,
      reason,
      score: suggested,
      perf: perfSummary,
      // ?perf only: the full per-frame log and the Test Case 2 results, for the download buttons.
      perfLog: perfLog
        ? perf.exportLog({
            videoUrl: videoUrl ?? null,
            trialSeconds: trialSeconds || null,
            delay: delay.describe(),
            sessionSeconds: seconds,
            userAgent: navigator.userAgent,
          })
        : null,
      summary: {
        hasReference: Boolean(reference),
        camera: reference?.camera ?? null,
        minJudgedFrames: MIN_JUDGED_FRAMES,
        judgedFrames: summary.judgedFrames,
        goodFrames: summary.goodFrames,
        skippedFrames: summary.skippedFrames,
        // The browser's own dropped-frame count when it reports one, otherwise the
        // frames we could not use because no body was found.
        droppedFrames: perfSummary.droppedFrames ?? noPoseFrames,
        // The raw score, without the minimum-judged-frames check the suggestion
        // uses, so the session can store what the tracker actually measured.
        trackingScore: summary.score,
        totalSets,
        repsPerSet: totalRepsPerSet,
        totalReps,
        setsCompleted: progress.setsDone,
        repsCompleted: progress.repsDone,
        joints: reference
          ? reference.targetJoints
              .filter((name) => name in summary.meanErrorDeg)
              .map((name) => ({
                name,
                meanErrorDeg: summary.meanErrorDeg[name],
                inRangePct: summary.inRangePct[name],
              }))
          : [],
      },
    }

    // `session-ended` drives the existing results form. `session-complete` is the
    // paper's name for the automatic end condition; it fires only on `complete`
    // and carries the same payload, so either name can be subscribed to.
    emit('session-ended', detail)
    if (reason === 'complete') emit('session-complete', detail)
  }

  const retryCamera = async () => {
    if (retrying || destroyed) return
    retrying = true
    if (retryButton) retryButton.disabled = true
    showCameraWarning(true, 'Requesting camera…')

    try {
      stopTracks()
      const acquired = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })

      if (destroyed || sessionEnded) {
        acquired.getTracks().forEach((track) => track.stop())
        return
      }

      attachStream(acquired)
      await video.play()
      if (destroyed || sessionEnded) return
      await resumeFromCamera()
    } catch (error) {
      if (destroyed) return
      console.error(error)
      showCameraWarning(true, cameraErrorMessage(error))
    } finally {
      retrying = false
      if (retryButton) retryButton.disabled = false
    }
  }

  // 2. Camera only starts when the user asks for it.
  const start = async () => {
    if (!landmarker || destroyed) {
      return
    }

    // Must run inside the click, before the first await, or iOS Safari blocks later speech.
    coach.unlock()

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(cameraErrorMessage({ name: 'SecurityError' }), 'error')
      return
    }

    startButton.disabled = true
    setStatus('Requesting camera…')

    let acquired
    try {
      acquired = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: { ideal: 30 } },
        audio: false,
      })
    } catch (error) {
      if (destroyed) return
      console.error(error)
      setStatus(cameraErrorMessage(error), 'error')
      startButton.disabled = false
      return
    }

    // Left the page while the permission prompt was open: do not keep the camera.
    if (destroyed) {
      acquired.getTracks().forEach((track) => track.stop())
      return
    }
    attachStream(acquired)
    try {
      await video.play()
    } catch (error) {
      halt()
      if (destroyed) return
      console.error(error)
      setStatus(cameraErrorMessage(error), 'error')
      startButton.disabled = false
      return
    }
    if (destroyed) {
      halt()
      return
    }

    setStatus('Camera ready.', 'ok')
    lastVideoTime = -1
    startedAt = performance.now()
    pausedAt = null
    pausedByCamera = false
    sessionEnded = false
    sessionKey = newSessionKey()
    showCameraWarning(false)
    scorer = new SessionScorer()
    latest = null
    smoothed = {}
    noPoseFrames = 0
    frameCount = 0
    unseenFrames = 0
    coach.reset()
    handCache = []
    handInterval = baseHandInterval
    perf.reset()
    delay.reset()
    resetLivePanel()
    timerEl.textContent = formatElapsed(0)
    updateProgress(0)
    timerId = setInterval(tick, 250)

    setRunning(true)
    startLoop()

    if (trialSeconds) {
      setStatus(`Camera ready. This trial stops by itself after ${trialSeconds} seconds.`, 'ok')
      trialId = setTimeout(stop, trialSeconds * 1000)
    }
  }

  // 6. Stop: end the loop, release the camera, hand the duration to the score form.
  const stop = () => finish('manual')

  // Video element failures and long stalls are also signs the camera went away.
  const onVideoError = () => handleCameraLost('error')
  const onVideoStalled = () => {
    if (!startedAt || pausedByCamera || sessionEnded) return
    clearTimeout(stallTimer)
    stallTimer = setTimeout(() => {
      if (!destroyed && startedAt && !pausedByCamera && video.readyState < 2) handleCameraLost('stalled')
    }, 3000)
  }
  const onVideoPlaying = () => {
    clearTimeout(stallTimer)
    stallTimer = null
    // A stalled or muted camera can start delivering frames again without a
    // `unmute` event (e.g. after the browser recovers), so resume here too.
    const track = stream?.getVideoTracks()[0]
    if (pausedByCamera && track?.readyState === 'live' && !track.muted) {
      resumeFromCamera()
    }
  }

  const onEndSession = () => finish('camera-lost')

  startButton.addEventListener('click', start)
  stopButton.addEventListener('click', stop)
  soundButton?.addEventListener('click', toggleSound)
  retryButton?.addEventListener('click', retryCamera)
  endSessionButton?.addEventListener('click', onEndSession)
  video.addEventListener('error', onVideoError)
  video.addEventListener('stalled', onVideoStalled)
  video.addEventListener('playing', onVideoPlaying)

  // 7. Never leave the camera running after navigating away (tab close / bfcache).
  const onPageHide = () => halt()
  window.addEventListener('pagehide', onPageHide)

  loadModel()

  // Load the Blender reference for this exercise, if it has one (found via its video URL).
  const poseUrl = poseUrlFromVideo(videoUrl)
  if (poseUrl) {
    loadReference(poseUrl).then((loaded) => {
      if (!destroyed) reference = loaded
    })
  }

  return function destroy() {
    destroyed = true
    startButton.removeEventListener('click', start)
    stopButton.removeEventListener('click', stop)
    soundButton?.removeEventListener('click', toggleSound)
    retryButton?.removeEventListener('click', retryCamera)
    endSessionButton?.removeEventListener('click', onEndSession)
    video.removeEventListener('error', onVideoError)
    video.removeEventListener('stalled', onVideoStalled)
    video.removeEventListener('playing', onVideoPlaying)
    window.removeEventListener('pagehide', onPageHide)
    clearTimeout(stallTimer)
    stallTimer = null
    if (window.__justStretchPerf === perf) delete window.__justStretchPerf
    halt()
    closeModels()
  }
}