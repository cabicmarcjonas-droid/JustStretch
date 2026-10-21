import { DrawingUtils, FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision'
import { AudioCoach } from '../lib/audioCoach.js'
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
 *                       status, livePanel, liveScore, liveFrames, liveNote, liveTable, liveRows.
 * @param {object} options { videoUrl, landmarks, highlightHands }
 * @returns {() => void} destroy: stops the loop, the camera and the timer, and closes both models.
 */
export function initPoseTracker(els, { videoUrl, landmarks = [], highlightHands = false }) {
  const {
    video,
    canvas,
    overlay,
    startButton,
    stopButton,
    timer: timerEl,
    status: statusEl,
    livePanel,
    liveScore: liveScoreEl,
    liveFrames: liveFramesEl,
    liveNote: liveNoteEl,
    liveTable,
    liveRows: liveRowsEl,
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
 
  const elapsedSeconds = () => (startedAt ? Math.round((performance.now() - startedAt) / 1000) : 0)
 
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
  const processFrame = (captureTime, dropped) => {
    if (destroyed || !landmarker) {
      return
    }
 
    const t0 = performance.now()
    frameCount += 1
 
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
    processFrame(metadata.captureTime, dropped)
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
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
    video.srcObject = null
  }
 
  // Ends the loop and the timer, and releases the camera.
  const halt = () => {
    cancelAnimationFrame(frameId)
    if (vfcId !== null) video.cancelVideoFrameCallback?.(vfcId)
    clearTimeout(watchdogId)
    clearInterval(timerId)
    coach.stop()
    frameId = null
    vfcId = null
    watchdogId = null
    timerId = null
    stopTracks()
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
 
    stream = acquired
    video.srcObject = stream
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
    resetLivePanel()
    timerEl.textContent = formatElapsed(0)
    timerId = setInterval(() => {
      timerEl.textContent = formatElapsed(elapsedSeconds())
    }, 250)
 
    setRunning(true)
    startLoop()
  }
 
  // 6. Stop: end the loop, release the camera, hand the duration to the score form.
  const stop = () => {
    halt()
 
    const seconds = elapsedSeconds()
    startedAt = null
 
    timerEl.textContent = formatElapsed(seconds)
    setRunning(false)
    startButton.textContent = 'Restart'
    setStatus('Session stopped. Rate your form below to save it.')
 
    // Suggested score (0-100) from the pose comparison. null when this exercise has no
    // reference or too few frames were judged (e.g. Start then Stop right away).
    const summary = scorer.summary()
    const { score, judgedFrames } = summary
    const suggested = reference && judgedFrames >= MIN_JUDGED_FRAMES ? score : null
 
    const perfSummary = perf.summary()
    if (perfLog) console.log('[perf] session summary', perfSummary)
 
    // Everything the results card needs. `joints` only lists joints that were judged at least once.
    // `perf` is the FPS / latency data for the paper's evaluation; it is not saved to the server.
    emit('session-ended', {
      seconds,
      score: suggested,
      perf: perfSummary,
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
    })
  }
 
  startButton.addEventListener('click', start)
  stopButton.addEventListener('click', stop)
  soundButton?.addEventListener('click', toggleSound)
 
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
    window.removeEventListener('pagehide', onPageHide)
    if (window.__justStretchPerf === perf) delete window.__justStretchPerf
    halt()
    closeModels()
  }
}