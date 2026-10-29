// Fills the demo database with SYNTHETIC tracking results, so the sessions that
// were saved before the tracking fields existed can still show the per-joint
// table on the session detail page — and, since the limb filter was added, the
// per-limb rows (limbResults) derived from those same joints.
//
// These numbers are made up. The real per-joint measurements of those sessions
// were never stored and cannot be recovered. Never run this against a database
// that holds real study data.
//
//   npm --prefix server run backfill          # fill the empty sessions
//   npm --prefix server run backfill -- --undo  # remove the filled-in data again
import { faker } from '@faker-js/faker'
import mongoose from 'mongoose'
import { Exercise } from '../models/Exercise.js'
import { StretchSession } from '../models/StretchSession.js'
import { limbResultsFromJointResults } from '../shared/limbs.js'
import { TRACKED_JOINTS, poseName } from '../src/seed.js'

// limbResults rides along with the tracking fields: the undo removes both.
const FIELDS = ['jointResults', 'limbResults', 'judgedFrames', 'framesWithinMargin', 'trackingScore', 'droppedFrames', 'fatigue']
const undo = process.argv.includes('--undo')

const uri = process.env.MONGODB_URI?.trim()
if (!uri) {
  console.error('MONGODB_URI is not set. Copy server/.env.example to server/.env and fill it in.')
  process.exit(1)
}

await mongoose.connect(uri)

if (undo) {
  // Take back exactly what the fill added: only the tracking fields (including
  // the derived limb rows). timestamps:false leaves updatedAt alone, so the undo
  // is an exact revert.
  const result = await StretchSession.updateMany(
    { $or: [{ 'jointResults.0': { $exists: true } }, { 'limbResults.0': { $exists: true } }] },
    { $unset: Object.fromEntries(FIELDS.map((f) => [f, ''])) },
    { timestamps: false },
  )
  console.log(`[backfill] removed the tracking results from ${result.modifiedCount} sessions.`)
  await mongoose.disconnect()
  process.exit(0)
}

const exercises = new Map((await Exercise.find().lean()).map((exercise) => [String(exercise._id), exercise]))
const sessions = await StretchSession.find().sort({ _id: 1 }).lean()

let updated = 0
let limbOnly = 0
let skippedSelfRated = 0
let skippedDone = 0
const ops = []

for (const session of sessions) {
  const exercise = exercises.get(String(session.exercise))
  const joints = TRACKED_JOINTS[poseName(exercise?.videoUrl)]

  // A stretch without a reference pose is scored by hand: no joint data, and no
  // limb rows either — the limb filter only covers camera-tracked sessions.
  if (!joints) {
    skippedSelfRated++
    continue
  }
  // Fully filled in: the script can be run again safely.
  if ((session.jointResults ?? []).length > 0 && (session.limbResults ?? []).length > 0) {
    skippedDone++
    continue
  }

  // The same seed per session, so a re-run produces the same numbers.
  faker.seed([...String(session._id)].reduce((sum, char) => sum + char.charCodeAt(0), 0))

  // Sessions that already have per-joint rows (from an earlier run of this script)
  // only lack the newer limb rows: derive them from what is stored, without
  // touching the joint results.
  if ((session.jointResults ?? []).length > 0) {
    ops.push({
      updateOne: {
        filter: { _id: session._id },
        update: {
          $set: {
            limbResults: limbResultsFromJointResults(session.jointResults, session.judgedFrames ?? 0, session.durationSeconds ?? null),
          },
        },
      },
    })
    limbOnly++
    continue
  }

  // Derived from the score the session already has, so the form score, the
  // tracking score and the per-joint percentages all agree with each other.
  const trackingScore = Math.min(100, Math.max(0, session.score + faker.number.int({ min: -6, max: 6 })))
  const judgedFrames = faker.number.int({ min: 180, max: 620 })
  const framesWithinMargin = Math.round((judgedFrames * trackingScore) / 100)

  const jointResults = joints.map((joint) => ({
    joint,
    avgError: faker.number.float({ min: 1.5, max: 22, fractionDigits: 1 }),
    timeInRangePct: Math.min(100, Math.max(0, trackingScore + faker.number.int({ min: -25, max: 25 }))),
  }))

  ops.push({
    updateOne: {
      filter: { _id: session._id },
      update: {
        $set: {
          jointResults,
          // The limb rows are derived from the synthetic joints, scaled to the
          // session's length when it recorded one.
          limbResults: limbResultsFromJointResults(jointResults, judgedFrames, session.durationSeconds ?? null),
          judgedFrames,
          framesWithinMargin,
          trackingScore,
          droppedFrames: faker.number.int({ min: 0, max: 42 }),
          fatigue: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), { probability: 0.7 }) ?? null,
        },
      },
    },
  })
  updated++
}

// $set on the tracking fields only. timestamps:false leaves updatedAt alone.
if (ops.length > 0) await StretchSession.bulkWrite(ops, { timestamps: false })

console.log(
  `[backfill] ${updated} sessions filled in, ${limbOnly} got limb rows added, ${skippedDone} already had tracking results, ` +
    `${skippedSelfRated} were scored by hand, ${sessions.length} sessions in total.`,
)

await mongoose.disconnect()
