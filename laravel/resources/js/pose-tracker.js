/**
 * Live pose and hand tracking for the stretch session page.
 *
 * Runs MediaPipe PoseLandmarker (33 body points) and HandLandmarker (21 points
 * per hand, i.e. every finger joint) entirely in the browser: camera frames and
 * landmarks never leave the device. When the user presses Stop, the elapsed
 * time is broadcast as a `session-ended` window event for the score form.
 */
import { DrawingUtils, FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';

// Must match the exact version in package.json so the JS and wasm agree.
const MEDIAPIPE_VERSION = '1.0.1';
const WASM_PATH = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL =
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const HAND_MODEL_URL =
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Pose landmarks 17–22 are the pose model's rough pinky/index/thumb points.
// When the hand model sees a hand, its 21-point skeleton replaces them.
const POSE_HAND_POINTS = new Set([17, 18, 19, 20, 21, 22]);

const ACCENT = '#3f6b52';
const MUTED_LINE = 'rgba(228, 228, 223, 0.85)';
const MUTED_POINT = 'rgba(107, 111, 105, 0.9)';

const stage = document.getElementById('pose-stage');

if (stage) {
    initPoseTracker(stage);
}

function initPoseTracker(stage) {
    const video = stage.querySelector('#pose-video');
    const canvas = stage.querySelector('#pose-canvas');
    const overlay = stage.querySelector('#pose-overlay');
    const startButton = document.getElementById('pose-start');
    const stopButton = document.getElementById('pose-stop');
    const timerEl = document.getElementById('pose-timer');
    const statusEl = document.getElementById('pose-status');

    const ctx = canvas.getContext('2d');
    const drawingUtils = new DrawingUtils(ctx);
    const highlighted = new Set(JSON.parse(stage.dataset.landmarks || '[]'));
    const highlightedConnections = PoseLandmarker.POSE_CONNECTIONS.filter(
        ({ start, end }) => highlighted.has(start) && highlighted.has(end),
    );
    const highlightHands = stage.dataset.highlightHands === 'true';
    const bodyOnlyConnections = PoseLandmarker.POSE_CONNECTIONS.filter(
        ({ start, end }) => !POSE_HAND_POINTS.has(start) && !POSE_HAND_POINTS.has(end),
    );

    let landmarker = null;
    let handLandmarker = null;
    let stream = null;
    let frameId = null;
    let timerId = null;
    let startedAt = null;
    let lastVideoTime = -1;

    const setStatus = (message, tone = 'muted') => {
        statusEl.textContent = message;
        statusEl.dataset.tone = tone;
    };

    const formatElapsed = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const elapsedSeconds = () => (startedAt ? Math.round((performance.now() - startedAt) / 1000) : 0);

    const setRunning = (running) => {
        startButton.disabled = running || !landmarker;
        stopButton.disabled = !running;
        overlay.classList.toggle('hidden', running);
        overlay.classList.toggle('flex', !running);
    };

    // 1. Load the models as soon as the page opens (camera is NOT requested yet).
    const withGpuFallback = async (create) => {
        try {
            return await create('GPU');
        } catch (gpuError) {
            // Some machines lack WebGL2 support; the CPU path is slower but works.
            console.warn('GPU delegate unavailable, falling back to CPU.', gpuError);
            return create('CPU');
        }
    };

    const loadModel = async () => {
        setStatus('Loading pose and hand models…');
        startButton.disabled = true;

        const vision = await FilesetResolver.forVisionTasks(WASM_PATH).catch((error) => {
            console.error(error);
            return null;
        });

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
        ]);

        landmarker = pose.status === 'fulfilled' ? pose.value : null;
        handLandmarker = hands.status === 'fulfilled' ? hands.value : null;

        if (!landmarker) {
            console.error(pose.reason);
            setStatus(
                'Could not load the pose model. Check your internet connection and reload the page.',
                'error',
            );
            return;
        }

        if (!handLandmarker) {
            // Finger tracking is a bonus; the session still works with body tracking alone.
            console.warn('Hand model unavailable; tracking body only.', hands.reason);
            setStatus('Pose model ready (finger tracking unavailable). Press Start when you are in frame.');
        } else {
            setStatus('Pose and hand models ready. Press Start when you are in frame.');
        }

        startButton.disabled = false;
    };

    const cameraErrorMessage = (error) => {
        switch (error?.name) {
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                return 'Camera permission was denied. Allow camera access in your browser settings and press Start again.';
            case 'NotFoundError':
            case 'DevicesNotFoundError':
            case 'OverconstrainedError':
                return 'No camera was found. Connect a webcam and press Start again.';
            case 'NotReadableError':
            case 'TrackStartError':
                return 'Your camera is being used by another application. Close it and try again.';
            case 'SecurityError':
                return 'Camera access is blocked on this address. Open the app at http://127.0.0.1:8000 or http://localhost:8000.';
            default:
                return `Could not start the camera${error?.message ? `: ${error.message}` : '.'}`;
        }
    };

    // 3–5. Detection loop: draw the frame, the full skeleton, then the target joints.
    const renderFrame = () => {
        frameId = requestAnimationFrame(renderFrame);

        if (video.readyState < 2 || video.currentTime === lastVideoTime) {
            return;
        }
        lastVideoTime = video.currentTime;

        const timestamp = performance.now();
        const pose = landmarker.detectForVideo(video, timestamp).landmarks?.[0];
        const hands = handLandmarker?.detectForVideo(video, timestamp).landmarks ?? [];
        const handsFound = hands.length > 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (!pose?.length && !handsFound) {
            setStatus('No person detected. Step back so your upper body is in view.', 'warn');
            return;
        }

        setStatus('Tracking. Green joints are the ones this stretch targets.', 'ok');

        if (pose?.length) {
            // Skip the pose model's coarse hand points when real finger tracking is available.
            const showPoint = (index) => !(handsFound && POSE_HAND_POINTS.has(index));

            drawingUtils.drawConnectors(pose, handsFound ? bodyOnlyConnections : PoseLandmarker.POSE_CONNECTIONS, {
                color: MUTED_LINE,
                lineWidth: 2,
            });
            drawingUtils.drawLandmarks(
                pose.filter((_, index) => showPoint(index)),
                { color: MUTED_POINT, fillColor: MUTED_POINT, radius: 2, lineWidth: 1 },
            );

            drawingUtils.drawConnectors(
                pose,
                highlightedConnections.filter(({ start, end }) => showPoint(start) && showPoint(end)),
                { color: ACCENT, lineWidth: 5 },
            );
            drawingUtils.drawLandmarks(
                pose.filter((_, index) => highlighted.has(index) && showPoint(index)),
                { color: '#ffffff', fillColor: ACCENT, radius: 7, lineWidth: 2 },
            );
        }

        for (const hand of hands) {
            drawingUtils.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, {
                color: highlightHands ? ACCENT : MUTED_LINE,
                lineWidth: highlightHands ? 4 : 2,
            });
            drawingUtils.drawLandmarks(
                hand,
                highlightHands
                    ? { color: '#ffffff', fillColor: ACCENT, radius: 4, lineWidth: 1.5 }
                    : { color: MUTED_POINT, fillColor: MUTED_POINT, radius: 2, lineWidth: 1 },
            );
        }
    };

    const stopTracks = () => {
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        video.srcObject = null;
    };

    // 2. Camera only starts when the user asks for it.
    const start = async () => {
        if (!landmarker) {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus(cameraErrorMessage({ name: 'SecurityError' }), 'error');
            return;
        }

        startButton.disabled = true;
        setStatus('Requesting camera…');

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: false,
            });
        } catch (error) {
            console.error(error);
            setStatus(cameraErrorMessage(error), 'error');
            startButton.disabled = false;
            return;
        }

        video.srcObject = stream;
        await video.play();

        setStatus('Camera ready.', 'ok');
        lastVideoTime = -1;
        startedAt = performance.now();
        timerEl.textContent = formatElapsed(0);
        timerId = setInterval(() => {
            timerEl.textContent = formatElapsed(elapsedSeconds());
        }, 250);

        setRunning(true);
        renderFrame();
    };

    // 6. Stop: end the loop, release the camera, hand the duration to the score form.
    const stop = () => {
        cancelAnimationFrame(frameId);
        clearInterval(timerId);
        frameId = null;
        timerId = null;

        const seconds = elapsedSeconds();
        startedAt = null;
        stopTracks();

        timerEl.textContent = formatElapsed(seconds);
        setRunning(false);
        startButton.textContent = 'Restart';
        setStatus('Session stopped. Rate your form below to save it.');

        window.dispatchEvent(new CustomEvent('session-ended', { detail: { seconds } }));
    };

    startButton.addEventListener('click', start);
    stopButton.addEventListener('click', stop);

    // 7. Never leave the camera running after navigating away.
    window.addEventListener('pagehide', () => {
        cancelAnimationFrame(frameId);
        clearInterval(timerId);
        stopTracks();
    });

    loadModel();
}
