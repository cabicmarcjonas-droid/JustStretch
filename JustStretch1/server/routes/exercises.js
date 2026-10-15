import { Router } from 'express'
import { deleteExercise } from '../models/cascade.js'
import { Exercise } from '../models/Exercise.js'
import { StretchSession } from '../models/StretchSession.js'
import { forbidden, isValidId, notFound } from '../middleware/errors.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { exerciseSchema, sessionSchema } from '../middleware/schemas.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth)

const PER_PAGE = 9
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const asString = (v) => (typeof v === 'string' ? v.trim() : '')
const asPage = (v) => Math.max(1, Number.parseInt(v, 10) || 1)

const withAuthor = (query) => query.populate('author', 'name')

async function loadExercise(req, res, next) {
  if (!isValidId(req.params.id)) return notFound(res)
  const exercise = await withAuthor(Exercise.findById(req.params.id))
  if (!exercise) return notFound(res)
  req.exercise = exercise
  next()
}

// Only the member who added an exercise may change or remove it (ExercisePolicy).
function authorOnly(req, res, next) {
  if (String(req.exercise.author._id) !== String(req.user._id)) return forbidden(res)
  next()
}

router.get('/', async (req, res) => {
  const search = asString(req.query.search)
  const area = asString(req.query.area)
  const difficulty = asString(req.query.difficulty)
  const page = asPage(req.query.page)

  const filter = {}
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' }
  if (area) filter.targetArea = area
  if (difficulty) filter.difficulty = difficulty

  const total = await Exercise.countDocuments(filter)
  const data = await withAuthor(
    Exercise.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * PER_PAGE)
      .limit(PER_PAGE),
  )

  res.json({ data, meta: { page, lastPage: Math.max(1, Math.ceil(total / PER_PAGE)), total } })
})

router.post('/', validate(exerciseSchema), async (req, res) => {
  const exercise = await Exercise.create({ ...req.body, author: req.user._id })
  await exercise.populate('author', 'name')
  res.status(201).json({ exercise })
})

router.get('/:id', loadExercise, async (req, res) => {
  const recentSessions = await StretchSession.find({ user: req.user._id, exercise: req.exercise._id })
    .sort({ completedAt: -1 })
    .limit(5)

  res.json({ exercise: req.exercise, recentSessions })
})

// Authorisation runs before validation, like UpdateExerciseRequest::authorize().
router.put('/:id', loadExercise, authorOnly, validate(exerciseSchema), async (req, res) => {
  req.exercise.set(req.body)
  await req.exercise.save()
  res.json({ exercise: req.exercise })
})

router.delete('/:id', loadExercise, authorOnly, async (req, res) => {
  await deleteExercise(req.exercise._id)
  res.json({ ok: true, title: req.exercise.title })
})

router.post('/:id/sessions', loadExercise, validate(sessionSchema), async (req, res) => {
  const session = await StretchSession.create({
    user: req.user._id,
    exercise: req.exercise._id,
    score: req.body.score,
    durationSeconds: req.body.durationSeconds ?? null,
    notes: req.body.notes ?? null,
    completedAt: new Date(),
  })

  res.status(201).json({
    session,
    message: `Session saved for "${req.exercise.title}". Nice work!`,
  })
})

export default router
