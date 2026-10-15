import { Router } from 'express'
import { Exercise } from '../models/Exercise.js'
import { StretchSession } from '../models/StretchSession.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)

// Asia/Manila is UTC+8 all year (no daylight saving).
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

// Midnight on Monday of the current week, in Asia/Manila, as a real instant.
export function startOfWeekManila(now = new Date()) {
  const shifted = new Date(now.getTime() + MANILA_OFFSET_MS)
  const sinceMonday = (shifted.getUTCDay() + 6) % 7
  const midnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - sinceMonday)
  return new Date(midnight - MANILA_OFFSET_MS)
}

// Consecutive days (Asia/Manila) with at least one session, ending today or yesterday.
// `days` is a Set of 'YYYY-MM-DD' Manila dates. A streak that ended yesterday still counts,
// so it does not read 0 in the morning before today's session.
export function computeStreak(days, now = new Date()) {
  const cursor = new Date(now.getTime() + MANILA_OFFSET_MS)
  const key = (d) => d.toISOString().slice(0, 10)

  if (!days.has(key(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1)

  let streak = 0
  while (days.has(key(cursor))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

router.get('/', async (req, res) => {
  const userId = req.user._id
  const mine = { user: userId }
  const now = new Date()

  const [totalSessions, lastWeek, thisWeek, areaCounts, triedIds, recent, activeDays] = await Promise.all([
    StretchSession.countDocuments(mine),
    StretchSession.aggregate([
      { $match: { user: userId, completedAt: { $gte: new Date(now.getTime() - 7 * DAY_MS) } } },
      { $group: { _id: null, avg: { $avg: '$score' } } },
    ]),
    StretchSession.aggregate([
      { $match: { user: userId, completedAt: { $gte: startOfWeekManila(now) } } },
      { $group: { _id: null, seconds: { $sum: { $ifNull: ['$durationSeconds', 0] } } } },
    ]),
    StretchSession.aggregate([
      { $match: { user: userId } },
      { $lookup: { from: 'exercises', localField: 'exercise', foreignField: '_id', as: 'ex' } },
      { $unwind: '$ex' },
      { $group: { _id: '$ex.targetArea', total: { $sum: 1 } } },
      { $sort: { total: -1, _id: 1 } },
      { $limit: 1 },
    ]),
    StretchSession.distinct('exercise', mine),
    StretchSession.find(mine).sort({ completedAt: -1, _id: -1 }).limit(5).populate('exercise', 'title targetArea'),
    StretchSession.aggregate([
      { $match: mine },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'Asia/Manila' } } } },
    ]),
  ])

  // 3 random exercises the user has not tried yet; any 3 if they have tried everything.
  const sample = async (match) => Exercise.aggregate([{ $match: match }, { $sample: { size: 3 } }, { $project: { _id: 1 } }])
  let picked = await sample({ _id: { $nin: triedIds } })
  if (picked.length === 0) picked = await sample({})
  const suggestions = await Exercise.find({ _id: { $in: picked.map((p) => p._id) } }).populate('author', 'name')

  res.json({
    totalSessions,
    averageScore: lastWeek[0] ? Math.round(lastWeek[0].avg) : null,
    minutesThisWeek: Math.floor((thisWeek[0]?.seconds ?? 0) / 60),
    topArea: areaCounts[0]?._id ?? null,
    streak: computeStreak(new Set(activeDays.map((d) => d._id)), now),
    recentSessions: recent,
    suggestions,
  })
})

export default router
