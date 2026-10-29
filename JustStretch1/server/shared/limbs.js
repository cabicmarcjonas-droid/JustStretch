// Limb grouping for the form score filter (professor's feedback: the all-sessions
// score summary is too general, so a member can now see the score for specific limbs).
//
// One file, easy to edit. It maps the joint metrics the camera measures (the same
// names the Blender reference files use, e.g. "left_shoulder", "trunk_lean") to six
// limbs. The server uses it to validate `limbResults` and the `?limbs=` dashboard
// filter; the client re-exports it (src/lib/limbs.js) so the tracker, the dashboard
// chips and the session pages all agree with the API.
//
// Hips sit with the legs: the measured hip angle runs shoulder→hip→knee, which is a
// leg measurement. The torso keeps trunk_lean, the neck keeps neck_tilt.

export const LIMBS = [
  {
    id: 'leftArm',
    label: 'Left arm',
    joints: ['left_shoulder', 'left_elbow'],
    areas: ['shoulders', 'chest', 'upper_back', 'wrists'],
  },
  {
    id: 'rightArm',
    label: 'Right arm',
    joints: ['right_shoulder', 'right_elbow'],
    areas: ['shoulders', 'chest', 'upper_back', 'wrists'],
  },
  {
    id: 'leftLeg',
    label: 'Left leg',
    joints: ['left_hip', 'left_knee', 'left_ankle'],
    areas: ['hips', 'hamstrings', 'quads', 'calves'],
  },
  {
    id: 'rightLeg',
    label: 'Right leg',
    joints: ['right_hip', 'right_knee', 'right_ankle'],
    areas: ['hips', 'hamstrings', 'quads', 'calves'],
  },
  {
    id: 'torso',
    label: 'Torso / spine',
    joints: ['trunk_lean'],
    areas: ['upper_back', 'lower_back', 'chest'],
  },
  {
    id: 'neck',
    label: 'Neck / head',
    joints: ['neck_tilt'],
    areas: ['neck'],
  },
]

export const LIMB_IDS = LIMBS.map((limb) => limb.id)

// "left_shoulder" -> "leftArm", for grouping a frame's judged joints by limb.
// Vector metrics that belong to no limb (none today) simply map to nothing.
export const LIMB_BY_JOINT = Object.fromEntries(
  LIMBS.flatMap((limb) => limb.joints.map((joint) => [joint, limb.id])),
)

export const limbLabel = (id) => LIMBS.find((limb) => limb.id === id)?.label ?? id

// The body areas whose exercises work this limb. The dashboard's empty state uses
// them to suggest exercises from the library when a limb has no data yet.
export const limbAreas = (id) => LIMBS.find((limb) => limb.id === id)?.areas ?? []

// Derives per-limb rows from stored per-joint rows. Used by the seed and the
// backfill script for sessions whose real per-frame limb results were never
// stored: each limb's score is the mean of its joints' time-in-range percentages,
// scaled onto the session's judged-frame count (goodFrames = judgedFrames x mean).
// These are documented approximations for demo/backfill data only — a live session
// computes its limb results frame by frame in the tracker instead. Returns [] when
// no joint belongs to a limb, so untracked sessions get no limb rows at all.
export function limbResultsFromJointResults(jointResults, judgedFrames, durationSeconds = null) {
  const byLimb = new Map()
  for (const { joint, timeInRangePct } of jointResults ?? []) {
    const limb = LIMB_BY_JOINT[joint]
    if (!limb) continue
    if (!byLimb.has(limb)) byLimb.set(limb, [])
    byLimb.get(limb).push(timeInRangePct)
  }
  return [...byLimb.entries()].map(([limb, pcts]) => {
    const mean = Math.round(pcts.reduce((sum, pct) => sum + pct, 0) / pcts.length)
    return {
      limb,
      score: mean,
      judgedFrames,
      goodFrames: Math.round((judgedFrames * mean) / 100),
      secondsInForm: durationSeconds == null ? null : Math.round((durationSeconds * mean) / 100),
    }
  })
}
