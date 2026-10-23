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

// The last `count` Manila days, oldest first, ending today: [{ date: 'YYYY-MM-DD', active }].
// Drives the week strip next to the streak.
export function recentDays(days, now = new Date(), count = 7) {
  const cursor = new Date(now.getTime() + MANILA_OFFSET_MS)
  const out = []
  for (let i = 0; i < count; i += 1) {
    const date = cursor.toISOString().slice(0, 10)
    out.unshift({ date, active: days.has(date) })
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return out
}

// How many recent sessions the score chart shows.
const HISTORY_SIZE = 14
const SUGGESTION_COUNT = 4

const sample = (match, size) => Exercise.aggregate([{ $match: match }, { $sample: { size } }, { $project: { _id: 1 } }])

// Random exercises, untried ones first; falls back to any exercise once everything has been tried.
async function sampleUntriedFirst(match, triedIds, size) {
  const untried = await sample({ $and: [match, { _id: { $nin: triedIds } }] }, size)
  return untried.length > 0 ? untried : sample(match, size)
}

// The first suggestion is the dashboard's "Suggested next". When the member has marked pain
// areas on their body map, it comes from one of those areas, picked at random so several
// areas take turns. Without a body map (or with no exercises in those areas) it is any
// random exercise, as before. The rest fill "Not tried yet".
export async function pickSuggestions(painAreas, triedIds) {
  let pick = null
  if (painAreas.length > 0) {
    const stocked = await Exercise.distinct('targetArea', { targetArea: { $in: painAreas } })
    if (stocked.length > 0) {
      const area = stocked[Math.floor(Math.random() * stocked.length)]
      ;[pick] = await sampleUntriedFirst({ targetArea: area }, triedIds, 1)
    }
  }

  const rest = await sampleUntriedFirst(pick ? { _id: { $ne: pick._id } } : {}, triedIds, pick ? SUGGESTION_COUNT - 1 : SUGGESTION_COUNT)
  const ids = [...(pick ? [pick._id] : []), ...rest.map((p) => p._id)]

  // find() returns its own order, so put them back in the order they were picked.
  const found = await Exercise.find({ _id: { $in: ids } }).populate('author', 'name')
  const byId = new Map(found.map((e) => [String(e._id), e]))
  return ids.map((id) => byId.get(String(id))).filter(Boolean)
}

router.get('/', async (req, res) => {
  const userId = req.user._id
  const mine = { user: userId }
  const now = new Date()

  const [totalSessions, lastWeek, weekBefore, thisWeek, areaCounts, triedIds, recent, activeDays, history] = await Promise.all([
    StretchSession.countDocuments(mine),
    StretchSession.aggregate([
      { $match: { user: userId, completedAt: { $gte: new Date(now.getTime() - 7 * DAY_MS) } } },
      { $group: { _id: null, avg: { $avg: '$score' } } },
    ]),
    // The 7 days before that, so the dashboard can show "+6 vs last week".
    StretchSession.aggregate([
      {
        $match: {
          user: userId,
          completedAt: { $gte: new Date(now.getTime() - 14 * DAY_MS), $lt: new Date(now.getTime() - 7 * DAY_MS) },
        },
      },
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
    StretchSession.find(mine).sort({ completedAt: -1, _id: -1 }).limit(5).populate('exercise', 'title targetArea videoUrl'),
    StretchSession.aggregate([
      { $match: mine },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'Asia/Manila' } } } },
    ]),
    StretchSession.find(mine).sort({ completedAt: -1, _id: -1 }).limit(HISTORY_SIZE).select('score completedAt'),
  ])
  const days = new Set(activeDays.map((d) => d._id))

  const suggestions = await pickSuggestions(req.user.painAreas ?? [], triedIds)

  res.json({
    totalSessions,
    averageScore: lastWeek[0] ? Math.round(lastWeek[0].avg) : null,
    previousAverageScore: weekBefore[0] ? Math.round(weekBefore[0].avg) : null,
    minutesThisWeek: Math.floor((thisWeek[0]?.seconds ?? 0) / 60),
    topArea: areaCounts[0]?._id ?? null,
    topAreaSessions: areaCounts[0]?.total ?? 0,
    streak: computeStreak(days, now),
    recentDays: recentDays(days, now),
    scoreHistory: history.reverse().map((s) => ({ score: s.score, completedAt: s.completedAt })),
    recentSessions: recent,
    suggestions,
  })
})

export default router
