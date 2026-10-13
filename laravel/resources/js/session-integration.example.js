// EXAMPLE ONLY: copy these pieces into the file that already runs PoseLandmarker
// (search the project for "PoseLandmarker"). Variable names like `video`, `ctx`,
// `videoUrl` stand for whatever your existing code calls them.
 
import {
  poseUrlFromVideo, loadReference, computeUserAngles, compareToReference,
  jointLandmarkIndex, SessionScorer,
} from './poseComparison.js';
 
let reference = null;          // stays null when the exercise has no pose file
let scorer = new SessionScorer();
let startedAt = null;
let latest = null;             // last comparison result, used for drawing
 
// 1) Once, when the session page loads. Pass the exercise's video_url (from the seeder,
//    e.g. "/videos/neck_side_tilt.mp4"). Only 4 exercises have one, so the others get null
//    and should keep using the self-rated slider.
export async function initReference(videoUrl) {
  const url = poseUrlFromVideo(videoUrl);
  reference = url ? await loadReference(url) : null;
  // reference?.camera is "Cam_Front" or "Cam_Side": tell the user to face the
  // camera or stand sideways to it.
}
 
// 2) When the user presses Start.
export function onStart() {
  scorer = new SessionScorer();
  startedAt = performance.now();
}
 
// 3) Inside your existing per-frame callback, right after detection gives you `result`.
export function onPoseResult(result, video) {
  if (!reference || startedAt === null || !result.landmarks?.[0]) return;
 
  const elapsedSec = (performance.now() - startedAt) / 1000;
  const angles = computeUserAngles(result.landmarks[0], video.videoWidth, video.videoHeight, reference);
  latest = compareToReference(angles, reference, elapsedSec);
  scorer.add(latest);
}
 
// 4) When drawing your skeleton: colour a joint green/red from the latest result.
export function jointColor(landmarkIndex) {
  if (!latest) return 'grey';
  for (const [name, r] of Object.entries(latest.perJoint)) {
    if (jointLandmarkIndex(reference, name) === landmarkIndex) return r.ok ? 'limegreen' : 'red';
  }
  return 'grey';
}
 
// 5) When the user presses Stop/End: this replaces the self-rated slider value.
export function onEnd() {
  const { score, meanErrorDeg } = scorer.summary(); // score is 0..100 (null if nothing was judged)
  return { score, meanErrorDeg };
}
 