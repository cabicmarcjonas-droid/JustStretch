import { Router } from 'express'
import mongoose from 'mongoose'
import { Exercise } from '../models/Exercise.js'
import { StretchSession } from '../models/StretchSession.js'
import { forbidden, isValidId, notFound } from '../middleware/errors.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { sessionUpdateSchema } from '../middleware/schemas.js'
import { validate } from '../middleware/validate.js'
import { referralMessage } from '../shared/referral.js'

const router = Router()
router.use(requireAuth)

const PER_PAGE = 15
const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 30

// Count, average score and total time for sessions matching `match`.
async function summarise(match) {
  const [totals] = await StretchSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avg: { $avg: '$score' },
        seconds: { $sum: { $ifNull: ['$durationSeconds', 0] } },
      },
    },
  ])
  return { count: totals?.count ?? 0, averageScore: totals ? Math.round(totals.avg) : null, totalSeconds: totals?.seconds ?? 0 }
}

router.get('/', async (req, res) => {
  const exerciseId = isValidId(req.query.exercise) ? String(req.query.exercise) : null
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)

  const filter = { user: req.user._id }
  if (exerciseId) filter.exercise = exerciseId

  const total = await StretchSession.countDocuments(filter)
  const data = await StretchSession.find(filter)
    .populate('exercise', 'title targetArea videoUrl')
    .sort({ completedAt: -1, _id: -1 })
    .skip((page - 1) * PER_PAGE)
    .limit(PER_PAGE)

  // Exercises the user has practised, for the filter dropdown.
  const practisedIds = await StretchSession.distinct('exercise', { user: req.user._id })
  const exercises = await Exercise.find({ _id: { $in: practisedIds } })
    .select('title')
    .sort({ title: 1 })

  // Last-30-days summary and score trend, for the cards and chart above the table.
  // They follow the exercise filter, so picking an exercise shows its own numbers.
  const now = Date.now()
  const windowStart = new Date(now - WINDOW_DAYS * DAY_MS)
  const previousStart = new Date(now - 2 * WINDOW_DAYS * DAY_MS)
  // aggregate() does not cast strings to ObjectIds like find() does, so cast the filter here.
  const base = { user: req.user._id, ...(exerciseId ? { exercise: new mongoose.Types.ObjectId(exerciseId) } : {}) }
  const [current, previous, best, history] = await Promise.all([
    summarise({ ...base, completedAt: { $gte: windowStart } }),
    summarise({ ...base, completedAt: { $gte: previousStart, $lt: windowStart } }),
    StretchSession.findOne({ ...base, completedAt: { $gte: windowStart } })
      .sort({ score: -1, completedAt: -1 })
      .populate('exercise', 'title'),
    StretchSession.find({ ...base, completedAt: { $gte: windowStart } })
      .sort({ completedAt: 1, _id: 1 })
      .select('score completedAt'),
  ])

  res.json({
    data,
    meta: { page, lastPage: Math.max(1, Math.ceil(total / PER_PAGE)), total },
    exercises: exercises.map((e) => ({ id: String(e._id), title: e.title })),
    summary: {
      days: WINDOW_DAYS,
      ...current,
      previousAverageScore: previous.averageScore,
      best: best ? { score: best.score, title: best.exercise?.title ?? null, completedAt: best.completedAt } : null,
    },
    history: history.map((s) => ({ score: s.score, completedAt: s.completedAt })),
  })
})

// One session with its tracking results, for the session detail page.
router.get('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return notFound(res)
  const session = await StretchSession.findById(req.params.id)
    .populate('exercise', 'title targetArea videoUrl')
    .populate('referral.therapist')
  if (!session) return notFound(res)
  if (String(session.user) !== String(req.user._id)) return forbidden(res)

  // The referral message is built here so the wording stays in one place (shared/referral.js).
  const json = session.toJSON()
  if (json.referral) json.referral.message = referralMessage(json.referral.reason)
  res.json({ session: json })
})

// Editing a saved session, e.g. adding notes after an automatic save.
router.patch('/:id', validate(sessionUpdateSchema), async (req, res) => {
  if (!isValidId(req.params.id)) return notFound(res)
  const session = await StretchSession.findById(req.params.id)
  if (!session) return notFound(res)
  if (String(session.user) !== String(req.user._id)) return forbidden(res)

  if (req.body.score !== undefined && req.body.score !== null) session.score = req.body.score
  if (Object.hasOwn(req.body, 'notes')) session.notes = req.body.notes
  if (req.body.fatigue !== undefined && req.body.fatigue !== null) session.fatigue = req.body.fatigue
  await session.save()

  res.json({ session, message: 'Session updated.' })
})

router.delete('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return notFound(res)
  const session = await StretchSession.findById(req.params.id)
  if (!session) return notFound(res)
  if (String(session.user) !== String(req.user._id)) return forbidden(res)

  await session.deleteOne()
  res.json({ ok: true, message: 'Session removed from your history.' })
})

export default router
