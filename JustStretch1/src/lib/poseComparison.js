// resources/js/poseComparison.js
//
// Compares the user's live MediaPipe pose with a Blender reference file
// (public/poses/*.json). Everything is 2D and measured in pixel space, which is
// exactly how the reference angles ("angles_2d") were computed in Blender.
//
// Flow:  loadReference()  ->  computeUserAngles()  ->  compareToReference()  ->  SessionScorer
 
const UP = [0, -1]; // image y points down, so "up" is -y
 
// ---------------------------------------------------------------- loading ---
 
// "Neck Side Tilt" -> "neck_side_tilt" (matches the pose file names)
export function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
 
// The seeded video names match the pose names, so the pose file can be found from
// the exercise's video_url:  "/videos/neck_side_tilt.mp4" -> "/poses/pose_neck_side_tilt.json"
// Exercises without a video_url (so without a pose file) return null.
export function poseUrlFromVideo(videoUrl) {
  if (!videoUrl) return null;
  const base = String(videoUrl).split('/').pop().replace(/\.[^.]+$/, '');
  return `/poses/pose_${base}.json`;
}
 
// Fetch a reference file. Returns null when there is no file for the exercise
// (only the bundled exercises have one), so the page can fall back to the slider.
export async function loadReference(url, minRangeDeg = 10) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return slimReference(await res.json(), minRangeDeg);
  } catch (err) {
    console.error('Could not load pose reference:', err);
    return null;
  }
}
 
// The raw files are ~1 MB because of landmarks_3d / landmarks_2d. We only need
// the timestamp and angles_2d, plus the definitions of how each angle is made.
// targetJoints = metrics that actually move during the exercise (range >= minRangeDeg).
// Static ones (e.g. knees during a neck tilt) are ignored so they can't fail the user.
export function slimReference(json, minRangeDeg = 10) {
  const frames = json.frames.map((f) => ({ t: f.t, angles: f.angles_2d }));
  const targetJoints = Object.keys(frames[0].angles).filter((name) => {
    const v = frames.map((f) => f.angles[name]).filter((x) => x != null);
    return v.length > 0 && Math.max(...v) - Math.min(...v) >= minRangeDeg;
  });
  return {
    exercise: json.exercise,
    camera: json.camera, // "Cam_Front" or "Cam_Side": tells the user how to stand
    duration: frames[frames.length - 1].t,
    index: json.mediapipe_index, // name -> MediaPipe landmark index
    threePoint: json.angle_definitions.three_point, // name -> [a, vertex, c]
    vectorPair: json.angle_definitions.vector_pair, // trunk_lean, neck_tilt
    frames,
    targetJoints,
  };
}
 
// ----------------------------------------------------------------- points ---
 
function mid(a, b) {
  if (!a || !b) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}
 
// MediaPipe has no "neck" or "head_top" landmark, so these two are approximated:
//   neck     ~ midpoint of the shoulders
//   head_top ~ midpoint of the ears (landmarks 7 and 8)
// This makes neck_tilt a few degrees off from Blender's value, so give it a
// generous tolerance (see perJointTolerance below).
function getPoint(name, lm, index) {
  if (name in index) return lm[index[name]];
  switch (name) {
    case 'mid_shoulder': return mid(lm[11], lm[12]);
    case 'mid_hip': return mid(lm[23], lm[24]);
    case 'neck': return mid(lm[11], lm[12]);
    case 'head_top': return mid(lm[7], lm[8]);
    default: return null;
  }
}
 
// ----------------------------------------------------------------- angles ---
 
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
 
// Unsigned angle between two vectors, 0..180 degrees.
function angleBetween(u, v) {
  const m = Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]);
  if (m === 0) return null;
  const c = Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / m));
  return (Math.acos(c) * 180) / Math.PI;
}
 
// Compute every metric the reference file defines for one frame of landmarks.
//   lm     = result.landmarks[0] from MediaPipe PoseLandmarker
//   width/height = video.videoWidth / video.videoHeight (NOT the CSS size)
// A metric is null when any landmark it needs is not clearly visible.
export function computeUserAngles(lm, width, height, ref, minVisibility = 0.6) {
  const out = {};
  const visible = (p) => p && (p.visibility ?? 1) >= minVisibility;
  const px = (p) => [p.x * width, p.y * height];
  const pt = (name) => getPoint(name, lm, ref.index);
 
  // Three-point joint angles (elbows, shoulders, hips, knees, ankles): angle AT the middle point.
  for (const [name, [a, b, c]] of Object.entries(ref.threePoint)) {
    const A = pt(a), B = pt(b), C = pt(c);
    out[name] = visible(A) && visible(B) && visible(C)
      ? angleBetween(sub(px(A), px(B)), sub(px(C), px(B)))
      : null;
  }
 
  // Vector-pair metrics (trunk_lean, neck_tilt): angle between two directions.
  const vector = (def) => {
    if (def === 'UP') return UP;
    const P = pt(def[0]), Q = pt(def[1]);
    return visible(P) && visible(Q) ? sub(px(Q), px(P)) : null;
  };
  for (const [name, [d1, d2]] of Object.entries(ref.vectorPair)) {
    const u = vector(d1), v = vector(d2);
    out[name] = u && v ? angleBetween(u, v) : null;
  }
  return out;
}
 
// For drawing green/red joints: which MediaPipe landmark does this metric sit on?
// Returns null for trunk_lean / neck_tilt (they are not a single joint).
export function jointLandmarkIndex(ref, jointName) {
  const def = ref.threePoint[jointName];
  return def ? ref.index[def[1]] : null;
}
 
// ------------------------------------------------------------- comparison ---
 
// Compare the user's current angles with the reference at this point in the session.
//
// Users never move at exactly the reference speed, so instead of one fixed frame
// we look at reference frames within +/- windowSec of the elapsed time and use
// the closest match. Set windowSec to 0 for strict time matching (use this for
// the accuracy test against the rendered Blender video).
//
// Returns null if no target joint is visible (the frame can't be judged).
export function compareToReference(user, ref, elapsedSec, opts = { minVisibility: 0.6 }) {
  const {
    toleranceDeg = 15,                 // margin of error: the "threshold"
    perJointTolerance = { neck_tilt: 10 }, // neck moves only ~28 deg, so keep this tight
    windowSec = 1,                     // tested: 2 s is too forgiving (standing still passes)
    passRatio = 0.8,                   // share of target joints that must be inside tolerance
  } = opts;
 
  const joints = ref.targetJoints.filter((j) => user[j] != null);
  if (joints.length === 0) return null;
 
  // Past the end of the reference there is nothing to compare with (its last frame is
  // the neutral standing pose), so those frames are not judged.
  if (elapsedSec > ref.duration + windowSec) return null;
  const t = Math.min(Math.max(elapsedSec, 0), ref.duration);
  let candidates = ref.frames.filter((f) => Math.abs(f.t - t) <= windowSec);
  if (candidates.length === 0) {
    candidates = [ref.frames.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a))];
  }
 
  let best = null;
  for (const f of candidates) {
    let sum = 0, n = 0;
    for (const j of joints) {
      if (f.angles[j] != null) { sum += Math.abs(user[j] - f.angles[j]); n++; }
    }
    if (n > 0 && (!best || sum / n < best.meanErr)) best = { frame: f, meanErr: sum / n };
  }
  if (!best) return null;
 
  const perJoint = {};
  let passed = 0;
  for (const j of joints) {
    const refAngle = best.frame.angles[j];
    if (refAngle == null) continue;
    const errorDeg = Math.abs(user[j] - refAngle);
    const ok = errorDeg <= (perJointTolerance[j] ?? toleranceDeg);
    if (ok) passed++;
    perJoint[j] = { user: user[j], ref: refAngle, errorDeg, ok };
  }
 
  const score = passed / Object.keys(perJoint).length; // 0..1 for this frame
  return { good: score >= passRatio, score, perJoint, matchedT: best.frame.t };
}
 
// ---------------------------------------------------------- session score ---
 
// Collects the per-frame results and gives one number at the end.
//   score         = % of judged frames that were "good" (0..100)
//   meanErrorDeg  = average angle error per joint (the paper's "angle accuracy" metric)
export class SessionScorer {
  constructor() {
    this.judged = 0;
    this.good = 0;
    this.skipped = 0;
    this.errSum = {};
    this.errCount = {};
    this.okCount = {};
  }
 
  add(result) {
    if (!result) { this.skipped++; return; }
    this.judged++;
    if (result.good) this.good++;
    for (const [joint, r] of Object.entries(result.perJoint)) {
      this.errSum[joint] = (this.errSum[joint] || 0) + r.errorDeg;
      this.errCount[joint] = (this.errCount[joint] || 0) + 1;
      if (r.ok) this.okCount[joint] = (this.okCount[joint] || 0) + 1;
    }
  }
 
  summary() {
    const meanErrorDeg = {};
    const inRangePct = {}; // % of judged frames in which this joint was inside its margin
    for (const j of Object.keys(this.errSum)) {
      meanErrorDeg[j] = this.errSum[j] / this.errCount[j];
      inRangePct[j] = Math.round((100 * (this.okCount[j] || 0)) / this.errCount[j]);
    }
    return {
      score: this.judged ? Math.round((100 * this.good) / this.judged) : null,
      goodFrames: this.good,
      judgedFrames: this.judged,
      skippedFrames: this.skipped,
      meanErrorDeg,
      inRangePct,
    };
  }
}

// ------------------------------------------------------------ limb scoring ---

// Per-limb results for one session (Feature: the form score summary can be
// filtered by limb, so each session records how each limb did).
//
// A limb is judged on a frame only when at least one of its joints was actually
// compared in that frame — i.e. the joint is a target of the exercise (reference
// range >= 10 deg) and its landmarks were visible enough to measure. A limb that
// never appears is simply absent from the results, never recorded as 0%.
//
// A limb passes a frame when the share of its judged joints inside their margin
// reaches the same passRatio the whole-body frame uses, so "good form" means the
// same thing at both levels. The session stores per limb:
//   score         = % of that limb's judged frames that were good
//   judgedFrames  = frames in which the limb was judged at all
//   goodFrames    = judged frames in which the limb passed
//   secondsInForm = seconds (timestamp-based) the limb spent in good form
export class LimbScorer {
  // limbOfJoint maps a joint metric name ("left_shoulder") to a limb id
  // ("leftArm"); joints that belong to no limb are ignored here.
  constructor(limbOfJoint, { passRatio = 0.8 } = {}) {
    this.limbOfJoint = limbOfJoint;
    this.passRatio = passRatio;
    this.lastT = null;
    this.limbs = new Map(); // limb id -> { judged, good, seconds }
  }

  // `result` is one compareToReference() frame (null frames are skipped by the
  // caller, like SessionScorer). `elapsedSec` is the session clock at this frame,
  // used only to credit the time between two judged frames to a limb in form.
  add(result, elapsedSec) {
    if (!result) return;
    const delta = this.lastT == null ? 0 : Math.max(0, elapsedSec - this.lastT);
    this.lastT = elapsedSec;

    // Group this frame's compared joints by limb.
    const byLimb = new Map();
    for (const [joint, r] of Object.entries(result.perJoint)) {
      const limb = this.limbOfJoint(joint);
      if (!limb) continue;
      let entry = byLimb.get(limb);
      if (!entry) byLimb.set(limb, (entry = { total: 0, passed: 0 }));
      entry.total += 1;
      if (r.ok) entry.passed += 1;
    }

    for (const [limb, { total, passed }] of byLimb) {
      let state = this.limbs.get(limb);
      if (!state) this.limbs.set(limb, (state = { judged: 0, good: 0, seconds: 0 }));
      state.judged += 1;
      if (passed / total >= this.passRatio) {
        state.good += 1;
        state.seconds += delta;
      }
    }
  }

  // Rows in the order the limbs were first seen, so the UI stays stable.
  summary() {
    return [...this.limbs.entries()].map(([limb, { judged, good, seconds }]) => ({
      limb,
      score: judged ? Math.round((100 * good) / judged) : null,
      judgedFrames: judged,
      goodFrames: good,
      secondsInForm: Math.round(seconds),
    }));
  }
}