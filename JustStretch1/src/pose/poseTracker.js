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
import { emit } from '../lib/eventBus.js'
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
  } = els

  const ctx = canvas.getContext('2d')
  const drawingUtils = new DrawingUtils(ctx)
  const highlighted = new Set(landmarks)
  const highlightedConnections = PoseLandmarker.POSE_CONNECTIONS.filter(
    ({ start, end }) => highlighted.has(start) && highlighted.has(end),
  )
  const bodyOnlyConnections = PoseLandmarker.POSE_CONNECTIONS.filter(
    ({ start, end }) => !POSE_HAND_POINTS.has(start) && !POSE_HAND_POINTS.has(end),
  )

  let destroyed = false
  let landmarker = null
  let handLandmarker = null
  let stream = null
  let frameId = null
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

  // Blender reference pose for this exercise. Stays null when there is none,
  // in which case the page behaves exactly as before (manual slider only).
  let reference = null
  let scorer = new SessionScorer()
  let latest = null
  let smoothed = {}

  const setStatus = (message, tone = 'muted') => {
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

  // 3–5. Detection loop: draw the frame, the full skeleton, then the target joints.
  const renderFrame = () => {
    if (destroyed || !landmarker) {
      return
    }
    frameId = requestAnimationFrame(renderFrame)

    if (video.readyState < 2 || video.currentTime === lastVideoTime) {
      return
    }
    lastVideoTime = video.currentTime

    const timestamp = performance.now()
    const pose = landmarker.detectForVideo(video, timestamp).landmarks?.[0]
    const hands = handLandmarker?.detectForVideo(video, timestamp).landmarks ?? []
    const handsFound = hands.length > 0

    ctx.clearRect(0, 0, canvas.width, canvas.height)
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

    updateLivePanel(performance.now())

    if (latest) {
      setStatus(
        latest.good ? 'Good form. Keep it up.' : 'Adjust your form: red joints are off the reference.',
        latest.good ? 'ok' : 'warn',
      )
    } else {
      setStatus('Tracking. Green joints are the ones this stretch targets.', 'ok')
    }

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

      drawingUtils.drawConnectors(
        pose,
        highlightedConnections.filter(({ start, end }) => showPoint(start) && showPoint(end)),
        { color: ACCENT, lineWidth: 5 },
      )
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
    clearInterval(timerId)
    frameId = null
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
    renderFrame()
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
      clearInterval(timerId)
      frameId = null
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
    clearInterval(timerId)
    frameId = null
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
    const detail = {
      sessionId: sessionKey,
      seconds,
      reason,
      score: suggested,
      summary: {
        hasReference: Boolean(reference),
        camera: reference?.camera ?? null,
        minJudgedFrames: MIN_JUDGED_FRAMES,
        judgedFrames: summary.judgedFrames,
        goodFrames: summary.goodFrames,
        skippedFrames: summary.skippedFrames,
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

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(cameraErrorMessage({ name: 'SecurityError' }), 'error')
      return
    }

    startButton.disabled = true
    setStatus('Requesting camera…')

    let acquired
    try {
      acquired = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
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
    resetLivePanel()
    timerEl.textContent = formatElapsed(0)
    updateProgress(0)
    timerId = setInterval(tick, 250)

    setRunning(true)
    renderFrame()
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
    retryButton?.removeEventListener('click', retryCamera)
    endSessionButton?.removeEventListener('click', onEndSession)
    video.removeEventListener('error', onVideoError)
    video.removeEventListener('stalled', onVideoStalled)
    video.removeEventListener('playing', onVideoPlaying)
    window.removeEventListener('pagehide', onPageHide)
    clearTimeout(stallTimer)
    stallTimer = null
    halt()
    closeModels()
  }
}
