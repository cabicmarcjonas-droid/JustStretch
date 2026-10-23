// Port of database/seeders/*. Resets the collections and reseeds them.
// Run with `npm run seed`; the dev server also calls seedDatabase() when it
// falls back to an in-memory MongoDB.
import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { pathToFileURL } from 'node:url'
import { Exercise } from '../models/Exercise.js'
import { StretchSession } from '../models/StretchSession.js'
import { User } from '../models/User.js'

export const DEMO_EMAIL = 'demo@juststretch.test'

const TOTAL_SESSIONS = 40
const DEMO_SESSIONS = 12
// Indexes in the curated list authored by the demo account, so edit/delete
// (and the 403 on everyone else's exercises) can be demonstrated.
const DEMO_OWNED = [0, 4, 8]

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
    title: 'Chin Tuck',
    targetArea: 'neck',
    difficulty: 'beginner',
    description: 'Counters forward-head posture by gently drawing the head back over the spine.',
    instructions: 'Sit or stand with your back straight and eyes looking forward.\nGlide your chin straight back as if making a double chin.\nHold for 5 seconds, feeling a stretch at the base of the skull.\nRelax and repeat 10 times.',
  },
  {
    title: 'Shoulder Rolls',
    targetArea: 'shoulders',
    difficulty: 'beginner',
    description: 'A simple warm-up that loosens the shoulders and upper trapezius after long periods at a desk.',
    instructions: 'Stand with arms hanging loosely at your sides.\nLift both shoulders up toward your ears.\nRoll them back and down in a slow circle.\nDo 10 backward rolls, then 10 forward rolls.',
  },
  {
    title: 'Cross-Body Shoulder Stretch',
    targetArea: 'shoulders',
    difficulty: 'beginner',
    description: 'Stretches the back of the shoulder and the rear deltoid, which often tighten from carrying bags on one side.',
    instructions: 'Stand tall and bring your right arm straight across your chest.\nUse your left forearm to gently press the right arm closer to your body.\nKeep the right shoulder down, away from your ear.\nHold for 30 seconds, then switch arms.',
    videoUrl: '/videos/cross_body_shoulder.mp4',
  },
  {
    title: 'Doorway Chest Stretch',
    targetArea: 'chest',
    difficulty: 'intermediate',
    description: 'Opens the chest and front of the shoulders to balance out rounded, hunched posture.',
    instructions: 'Stand in a doorway and place your forearms on the frame, elbows at shoulder height.\nStep one foot forward through the doorway.\nLean your body forward until you feel a stretch across the chest.\nHold for 30 seconds, keeping your back straight.\nStep back and rest before repeating.',
  },
  {
    title: 'Cat-Cow',
    targetArea: 'upper_back',
    difficulty: 'beginner',
    description: 'A flowing movement between arching and rounding the spine that mobilises the upper and middle back.',
    instructions: 'Start on hands and knees with wrists under shoulders and knees under hips.\nInhale, drop your belly and lift your chest and gaze (cow).\nExhale, round your back toward the ceiling and tuck your chin (cat).\nMove slowly between the two positions for 10 breaths.',
  },
  {
    title: "Child's Pose",
    targetArea: 'lower_back',
    difficulty: 'beginner',
    description: 'A resting stretch that gently lengthens the lower back and hips while calming the breath.',
    instructions: 'Kneel on the floor with big toes touching and knees apart.\nSit your hips back toward your heels.\nWalk your hands forward and lower your chest toward the floor.\nRest your forehead down and breathe deeply for 30 to 60 seconds.',
  },
  {
    title: 'Knee-to-Chest Stretch',
    targetArea: 'lower_back',
    difficulty: 'beginner',
    description: 'Relieves tension in the lower back and glutes by drawing one knee toward the chest while lying down.',
    instructions: 'Lie on your back with both knees bent and feet flat.\nHug your right knee toward your chest with both hands.\nKeep your lower back relaxed against the floor.\nHold for 30 seconds, then switch legs.',
  },
  {
    title: 'Figure-Four Hip Stretch',
    targetArea: 'hips',
    difficulty: 'intermediate',
    description: 'Targets the outer hip and piriformis, a common source of hip and buttock tightness.',
    instructions: 'Lie on your back with both knees bent.\nCross your right ankle over your left knee to make a figure four.\nReach through and hold the back of your left thigh.\nGently pull the left leg toward you until you feel the right hip stretch.\nHold for 30 seconds, then switch sides.',
  },
  {
    title: 'Seated Hamstring Stretch',
    targetArea: 'hamstrings',
    difficulty: 'intermediate',
    description: 'Lengthens the back of the thighs, which can pull on the lower back when tight.',
    instructions: 'Sit on the floor with your right leg straight and left foot against your inner right thigh.\nSit tall and hinge forward from the hips over the straight leg.\nReach toward your shin or ankle without rounding your back.\nHold for 30 seconds, then switch legs.',
  },
  {
    title: 'Standing Quad Stretch',
    targetArea: 'quads',
    difficulty: 'intermediate',
    description: 'Stretches the front of the thigh and hip flexors while also challenging balance.',
    instructions: 'Stand next to a wall or chair for support.\nBend your right knee and hold your right ankle behind you.\nKeep your knees together and push your hips slightly forward.\nHold for 30 seconds, then switch legs.',
  },
  {
    title: 'Wall Calf Stretch',
    targetArea: 'calves',
    difficulty: 'beginner',
    description: 'Loosens tight calves that can contribute to foot, ankle and knee discomfort.',
    instructions: 'Stand facing a wall with your hands on it at chest height.\nStep your right foot back and keep the heel pressed to the floor.\nBend your front knee and lean toward the wall.\nHold for 30 seconds, then switch legs.',
  },
  {
    title: 'Wrist Flexor Stretch',
    targetArea: 'wrists',
    difficulty: 'beginner',
    description: 'Relieves tension in the forearm and wrist from typing, phone use and gripping.',
    instructions: 'Extend your right arm in front of you, palm facing up.\nUse your left hand to gently pull the right fingers down and back.\nKeep the elbow straight and shoulders relaxed.\nHold for 20 seconds, then switch hands.',
  },
  {
    title: 'Overhead Side Bend',
    targetArea: 'lower_back',
    difficulty: 'beginner',
    description: 'Stretches the sides of the trunk, from the hips up to the armpits, which stiffen after long hours of sitting.',
    instructions: 'Stand tall with your feet hip-width apart.\nRaise both arms out to the sides and up until your hands meet above your head.\nKeeping your arms overhead, lean your upper body to the right as your hips shift slightly to the left.\nHold for a few slow breaths, then return to centre.\nRepeat on the left side, then lower your arms.',
    videoUrl: '/videos/overhead_side_bend.mp4',
  },
  {
    title: 'Standing Hamstring Reach',
    targetArea: 'hamstrings',
    difficulty: 'intermediate',
    description: 'Lengthens the back of the thighs from a standing position by hinging forward at the hips.',
    instructions: 'Stand side-on to your camera with your feet hip-width apart.\nKeep your knees straight but not locked.\nHinge forward from the hips and let your arms hang toward your shins.\nHold for a few slow breaths without bouncing.\nRoll back up slowly to standing.',
    videoUrl: '/videos/standing_hamstring_reach.mp4',
  },
]

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

  return User.insertMany([...named, ...generated].map((u) => ({ ...u, password })))
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

    return {
      user: isDemo ? demo._id : faker.helpers.arrayElement(others)._id,
      exercise: faker.helpers.arrayElement(exercises)._id,
      score: faker.number.int({ min: 35, max: 98 }),
      durationSeconds: faker.number.int({ min: 60, max: 600 }),
      notes: faker.helpers.maybe(() => faker.helpers.arrayElement(NOTE_POOL), { probability: 0.4 }) ?? null,
      completedAt: new Date(now - ageMs),
    }
  })

  return StretchSession.insertMany(docs)
}

export async function seedDatabase() {
  // Fixed seed so every run (and every groupmate's laptop) gets the same data.
  faker.seed(20261016)

  await Promise.all([User.deleteMany({}), Exercise.deleteMany({}), StretchSession.deleteMany({})])
  await Promise.all([User.init(), Exercise.init(), StretchSession.init()])

  const users = await seedUsers()
  const demo = users.find((u) => u.email === DEMO_EMAIL)
  const others = users.filter((u) => u.email !== DEMO_EMAIL)

  const exercises = await seedExercises(demo, others)
  await seedSessions(demo, others, exercises)

  console.log(`[seed] ${users.length} users, ${exercises.length} exercises, ${TOTAL_SESSIONS} sessions. Demo login: ${DEMO_EMAIL} / password`)
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
