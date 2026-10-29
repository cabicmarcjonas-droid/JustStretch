// Port of database/seeders/*. Resets the collections and reseeds them.
// Run with `npm run seed`; the dev server also calls seedDatabase() when it
// falls back to an in-memory MongoDB.
import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { pathToFileURL } from 'node:url'
import { EmailVerificationChallenge } from '../models/EmailVerificationChallenge.js'
import { Exercise } from '../models/Exercise.js'
import { PasswordResetToken } from '../models/PasswordResetToken.js'
import { StretchSession } from '../models/StretchSession.js'
import { Therapist } from '../models/Therapist.js'
import { User } from '../models/User.js'
import { limbResultsFromJointResults } from '../shared/limbs.js'
import { UserSession } from '../models/UserSession.js'
import { Insight } from '../models/Insight.js'

export const DEMO_EMAIL = 'demo@juststretch.test'

const TOTAL_SESSIONS = 40
const DEMO_SESSIONS = 12
// Indexes in the curated list authored by the demo account, so edit/delete
// (and the 403 on everyone else's exercises) can be demonstrated.
const DEMO_OWNED = [0, 3, 4]

const DAY_MS = 24 * 60 * 60 * 1000

const BENEFIT_POOL = [
  'Relieves muscle tension',
  'Improves range of motion',
  'Supports better posture',
  'Reduces stiffness after sitting',
  'Eases mild chronic pain',
  'Improves blood flow',
  'Helps you unwind and breathe',
  'Builds body awareness',
  'Prepares muscles for activity',
  'Balances left and right sides',
]

const PRECAUTION_POOL = [
  'Stop if you feel sharp or shooting pain.',
  'Move slowly and never bounce into the stretch.',
  'Skip this stretch if you have a recent injury in this area.',
  'Keep breathing steadily; do not hold your breath.',
  'Stretch only to mild tension, never to pain.',
  'Check with a doctor first if you have had surgery here.',
]

const NOTE_POOL = [
  'Left side felt tighter than the right.',
  'Much easier than last time.',
  'Neck still a bit stiff after work.',
  'Held each side for the full 30 seconds.',
  'Felt a mild pull, no pain.',
  'Need to keep my shoulders down next time.',
  'Did this after a long study session.',
  'Breathing slowly helped a lot.',
  'Lost balance once, will use a chair next time.',
  'Back felt looser afterwards.',
]

const CURATED = [
  {
    title: 'Neck Side Tilt',
    targetArea: 'neck',
    difficulty: 'beginner',
    description: 'Lengthens the muscles along the side of the neck that tighten when you look down at a screen for hours.',
    instructions: 'Sit or stand tall with your shoulders relaxed.\nSlowly tilt your right ear toward your right shoulder without lifting the shoulder.\nHold for 20 seconds while breathing slowly.\nReturn to centre and repeat on the left side.',
    videoUrl: '/videos/neck_side_tilt.mp4',
  },
  {
    title: 'Shoulder Rolls',
    targetArea: 'shoulders',
    difficulty: 'beginner',
    description: 'A simple warm-up that loosens the shoulders and upper trapezius after long periods at a desk.',
    instructions: 'Stand with arms hanging loosely at your sides.\nLift both shoulders up toward your ears.\nRoll them back and down in a slow circle.\nKeep the movement smooth and keep breathing steadily.',
    videoUrl: '/videos/shoulder_rolls.mp4',
  },
  {
    title: 'Cross-Body Shoulder Stretch',
    targetArea: 'shoulders',
    difficulty: 'beginner',
    description: 'Stretches the back of the shoulder and the rear deltoid, which often tighten from carrying bags on one side.',
    instructions: 'Stand tall and bring your right arm straight across your chest.\nUse your left forearm to gently press the right arm closer to your body.\nKeep the right shoulder down, away from your ear.\nHold, then switch arms.',
    videoUrl: '/videos/cross_body_shoulder.mp4',
  },
  {
    title: 'Overhead Side Bend',
    targetArea: 'upper_back',
    difficulty: 'beginner',
    description: 'Stretches the sides of the trunk, from the hips up to the armpits, which stiffen after long hours of sitting.',
    instructions: 'Stand tall with your feet hip-width apart.\nRaise both arms out to the sides and up until your hands meet above your head.\nKeeping your arms overhead, lean your upper body to the right as your hips shift slightly to the left.\nHold for a few slow breaths, then return to centre.\nRepeat on the left side, then lower your arms.',
    videoUrl: '/videos/overhead_side_bend.mp4',
  },
  {
    title: 'Standing Torso Twist',
    targetArea: 'lower_back',
    difficulty: 'beginner',
    description: 'Gently rotates the spine to loosen the lower and mid back and ease stiffness from sitting.',
    instructions: 'Stand with your feet slightly wider than hip-width and your arms relaxed.\nTurn your upper body to the right, letting your arms swing along with the turn.\nKeep your hips mostly facing forward and your knees soft.\nReturn to centre and repeat on the left side at a slow, steady pace.',
    videoUrl: '/videos/torso_twist.mp4',
  },
  {
    title: 'Standing Windmill Arms',
    targetArea: 'shoulders',
    difficulty: 'intermediate',
    description: 'Large arm circles that warm up the shoulder joints and open the chest and upper back.',
    instructions: 'Stand tall with your feet hip-width apart.\nSwing one arm up and back in a big, smooth circle while the other arm follows in the opposite direction.\nKeep your core braced and avoid leaning back.\nMove slowly and keep breathing steadily.',
    videoUrl: '/videos/windmill_arms.mp4',
  },
]

// The exercises that have a reference pose file, with the joints the camera
// judges for them (public/poses/pose_*.json). Sessions for these exercises
// carry the tracking results the camera produced.
export const TRACKED_JOINTS = {
  neck_side_tilt: ['neck_tilt'],
  shoulder_rolls: ['left_shoulder', 'right_shoulder'],
  cross_body_shoulder: ['left_elbow', 'right_elbow', 'left_shoulder', 'right_shoulder'],
  overhead_side_bend: ['left_elbow', 'right_elbow', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'trunk_lean', 'neck_tilt'],
  torso_twist: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'neck_tilt'],
  windmill_arms: ['left_elbow', 'right_elbow', 'left_shoulder', 'right_shoulder', 'trunk_lean', 'neck_tilt'],
}

// The pose file name for an exercise video: "/videos/neck_side_tilt.mp4" -> "neck_side_tilt".
export function poseName(videoUrl) {
  if (!videoUrl) return null
  return String(videoUrl)
    .split('/')
    .pop()
    .replace(/\.[^.]+$/, '')
}

// Tracking results for one session, the way the camera would have reported them.
// `durationSeconds` scales the derived limb rows' secondsInForm.
function seedTracking(joints, durationSeconds) {
  const judgedFrames = faker.number.int({ min: 180, max: 620 })
  const framesWithinMargin = faker.number.int({ min: Math.round(judgedFrames * 0.45), max: judgedFrames })
  const withinPct = Math.round((100 * framesWithinMargin) / judgedFrames)

  const jointResults = joints.map((joint) => ({
    joint,
    avgError: faker.number.float({ min: 1.5, max: 22, fractionDigits: 1 }),
    timeInRangePct: Math.min(100, Math.max(0, withinPct + faker.number.int({ min: -25, max: 25 }))),
  }))

  return {
    jointResults,
    judgedFrames,
    framesWithinMargin,
    trackingScore: withinPct,
    droppedFrames: faker.number.int({ min: 0, max: 42 }),
    fatigue: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), { probability: 0.7 }) ?? null,
    // Per-limb rows derived from the same synthetic joints, so the demo account's
    // dashboard limb filter has data to show from the first run.
    limbResults: limbResultsFromJointResults(jointResults, judgedFrames, durationSeconds),
  }
}

// Sample therapists for the referral feature. These are NOT real people or
// clinics: replace them with real, consenting contacts before any public use.
// `placeholder: true` makes the app label them as sample contacts.
const THERAPISTS = [
  {
    name: 'Sample Therapist A',
    clinic: 'Sample Neck & Shoulder Clinic',
    areas: ['neck', 'shoulders', 'upper_back', 'chest'],
    phone: '+63 2 8000 0001',
    email: 'neck.shoulder@clinic.example.com',
    address: 'Sample address, Mandaluyong City',
  },
  {
    name: 'Sample Therapist B',
    clinic: 'Sample Back & Hip Clinic',
    areas: ['lower_back', 'hips'],
    phone: '+63 2 8000 0002',
    email: 'back.hip@clinic.example.com',
    address: 'Sample address, Pasig City',
  },
  {
    name: 'Sample Therapist C',
    clinic: 'Sample Sports Rehab Clinic',
    areas: ['hamstrings', 'quads', 'calves', 'wrists'],
    phone: '+63 2 8000 0003',
    email: 'sports.rehab@clinic.example.com',
    address: 'Sample address, Makati City',
  },
  {
    name: 'Sample Therapist D',
    clinic: 'Sample General Physical Therapy',
    areas: [],
    phone: '+63 2 8000 0004',
    email: 'general.pt@clinic.example.com',
    address: 'Sample address, Quezon City',
  },
].map((t) => ({ ...t, placeholder: true }))

export async function seedTherapists() {
  return Therapist.insertMany(THERAPISTS)
}

async function seedUsers() {
  // One hash reused for every account, like UserFactory's static $password.
  const password = await bcrypt.hash('password', 10)

  const named = [
    { name: 'Demo User', email: DEMO_EMAIL },
    { name: 'Miguel Estallo', email: 'miguel.estallo@example.net' },
    { name: 'Rene Baterbonia', email: 'rene.baterbonia@gmail.com' },
  ]

  const generated = []
  const used = new Set(named.map((u) => u.email))
  while (generated.length < 7) {
    const email = faker.internet.email().toLowerCase()
    if (used.has(email)) continue
    used.add(email)
    generated.push({ name: faker.person.fullName(), email })
  }

  const verifiedAt = new Date()
  return User.insertMany([...named, ...generated].map((u) => ({ ...u, password, emailVerifiedAt: verifiedAt })))
}

async function seedExercises(demo, others) {
  const docs = CURATED.map((curated, index) => ({
    ...curated,
    author: DEMO_OWNED.includes(index) ? demo._id : faker.helpers.arrayElement(others)._id,
    durationMinutes: faker.number.int({ min: 2, max: 10 }),
    sets: faker.number.int({ min: 1, max: 3 }),
    repsPerSet: faker.number.int({ min: 1, max: 6 }),
    benefits: faker.helpers.arrayElements(BENEFIT_POOL, 3),
    precautions: faker.helpers.maybe(() => faker.helpers.arrayElement(PRECAUTION_POOL), { probability: 0.6 }) ?? null,
    videoUrl: curated.videoUrl ?? null,
  }))

  // Spread createdAt so "newest first" has a stable, meaningful order.
  const now = Date.now()
  const stamped = docs.map((doc, i) => ({ ...doc, createdAt: new Date(now - (docs.length - i) * 60_000) }))
  return Exercise.insertMany(stamped, { timestamps: false })
}

async function seedSessions(demo, others, exercises) {
  const now = Date.now()
  // The stretches the camera can track, so the demo account's recent sessions
  // have per-joint results to open.
  const tracked = exercises.filter((exercise) => TRACKED_JOINTS[poseName(exercise.videoUrl)])

  const docs = Array.from({ length: TOTAL_SESSIONS }, (_, index) => {
    const isDemo = index < DEMO_SESSIONS
    // Random within the last 30 days, like the factory. The demo account's first three
    // sessions are pinned to today, yesterday and the day before, so its dashboard stats and
    // streak are never empty.
    const pinned = [20 * 60_000, DAY_MS + 3_600_000, 2 * DAY_MS + 7_200_000]
    const ageMs =
      isDemo && index < pinned.length
        ? pinned[index]
        : faker.number.int({ min: 60_000, max: 30 * DAY_MS })

    const exercise =
      isDemo && index < pinned.length && tracked.length > 0 ? tracked[index % tracked.length] : faker.helpers.arrayElement(exercises)
    const joints = TRACKED_JOINTS[poseName(exercise.videoUrl)]
    // The length is drawn first so the tracking results (and their limb rows) can
    // be scaled to it.
    const durationSeconds = faker.number.int({ min: 60, max: 600 })
    const tracking = joints ? seedTracking(joints, durationSeconds) : {}

    return {
      user: isDemo ? demo._id : faker.helpers.arrayElement(others)._id,
      exercise: exercise._id,
      // A tracked session scores close to what the camera measured.
      score:
        tracking.trackingScore == null
          ? faker.number.int({ min: 35, max: 98 })
          : Math.min(100, Math.max(0, tracking.trackingScore + faker.number.int({ min: -6, max: 6 }))),
      durationSeconds,
      notes: faker.helpers.maybe(() => faker.helpers.arrayElement(NOTE_POOL), { probability: 0.4 }) ?? null,
      completedAt: new Date(now - ageMs),
      ...tracking,
    }
  })

  return StretchSession.insertMany(docs)
}

export async function seedDatabase() {
  // Fixed seed so every run (and every groupmate's laptop) gets the same data.
  faker.seed(20261016)

  await Promise.all([
    User.deleteMany({}),
    Exercise.deleteMany({}),
    StretchSession.deleteMany({}),
    Therapist.deleteMany({}),
    UserSession.deleteMany({}),
    EmailVerificationChallenge.deleteMany({}),
    PasswordResetToken.deleteMany({}),
    Insight.deleteMany({}),
  ])
  await Promise.all([
    User.init(),
    Exercise.init(),
    StretchSession.init(),
    Therapist.init(),
    UserSession.init(),
    EmailVerificationChallenge.init(),
    PasswordResetToken.init(),
  ])

  const users = await seedUsers()
  const demo = users.find((u) => u.email === DEMO_EMAIL)
  const others = users.filter((u) => u.email !== DEMO_EMAIL)

  const exercises = await seedExercises(demo, others)
  await seedSessions(demo, others, exercises)
  const therapists = await seedTherapists()

  console.log(`[seed] ${users.length} users, ${exercises.length} exercises, ${TOTAL_SESSIONS} sessions, ${therapists.length} sample therapists. Demo login: ${DEMO_EMAIL} / password`)
}

// `node src/seed.js` (npm run seed): reset and reseed the database in MONGODB_URI.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const uri = process.env.MONGODB_URI?.trim()
  const inMemoryHint = '`npm run dev` starts an in-memory database and seeds it automatically, so there is nothing to seed here.'

  if (!uri) {
    console.log(`[seed] MONGODB_URI is not set in server/.env. ${inMemoryHint}`)
    process.exit(0)
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
  } catch (error) {
    console.log(`[seed] Could not reach MongoDB at ${uri} (${error.message}). ${inMemoryHint}`)
    process.exit(0)
  }
  await seedDatabase()
  await mongoose.disconnect()
}
