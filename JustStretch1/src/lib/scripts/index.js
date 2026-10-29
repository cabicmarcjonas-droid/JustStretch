import crossBodyShoulder from './crossBodyShoulder.js'
import neckSideTilt from './neckSideTilt.js'
import overheadSideBend from './overheadSideBend.js'
import shoulderRolls from './shoulderRolls.js'
import torsoTwist from './torsoTwist.js'
import windmillArms from './windmillArms.js'

// Keys are the video file names without extension, which are also the exercise slugs.
const scripts = {
  neck_side_tilt: neckSideTilt,
  shoulder_rolls: shoulderRolls,
  cross_body_shoulder: crossBodyShoulder,
  overhead_side_bend: overheadSideBend,
  torso_twist: torsoTwist,
  windmill_arms: windmillArms,
}

// "/videos/neck_side_tilt.mp4" -> "neck_side_tilt"
export function slugFromVideo(videoUrl) {
  if (!videoUrl) return null
  return String(videoUrl).split('/').pop().replace(/\.[^.]+$/, '')
}

// Returns null for exercises without a script (for example standing_hamstring_reach),
// which then run tracking only.
export function scriptForExercise(slug) {
  return scripts[slug] ?? null
}
