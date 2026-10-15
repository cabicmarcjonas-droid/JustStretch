import { Router } from 'express'
import { Exercise } from '../models/Exercise.js'
import { StretchSession } from '../models/StretchSession.js'
import { forbidden, isValidId, notFound } from '../middleware/errors.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)

const PER_PAGE = 15

router.get('/', async (req, res) => {
  const exerciseId = isValidId(req.query.exercise) ? String(req.query.exercise) : null
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)

  const filter = { user: req.user._id }
  if (exerciseId) filter.exercise = exerciseId

  const total = await StretchSession.countDocuments(filter)
  const data = await StretchSession.find(filter)
    .populate('exercise', 'title targetArea')
    .sort({ completedAt: -1, _id: -1 })
    .skip((page - 1) * PER_PAGE)
    .limit(PER_PAGE)

  // Exercises the user has practised, for the filter dropdown.
  const practisedIds = await StretchSession.distinct('exercise', { user: req.user._id })
  const exercises = await Exercise.find({ _id: { $in: practisedIds } })
    .select('title')
    .sort({ title: 1 })

  res.json({
    data,
    meta: { page, lastPage: Math.max(1, Math.ceil(total / PER_PAGE)), total },
    exercises: exercises.map((e) => ({ id: String(e._id), title: e.title })),
  })
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
