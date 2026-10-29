import { Router } from 'express'
import { Exercise } from '../models/Exercise.js'
import { StretchSession } from '../models/StretchSession.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { dashboardQuerySchema } from '../middleware/schemas.js'
import { formatIssues, validationError } from '../middleware/validate.js'
import { LIMBS } from '../shared/limbs.js'

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

// ---------------------------------------------------------------------------
// Limb filter (?limbs=leftArm,rightLeg)
//
// The unfiltered dashboard averages each session's whole-body `score`. With limbs
// selected the score is rebuilt from the per-limb frame counts instead, and it is
// FRAME-WEIGHTED, never a plain average of percentages: a limb judged on 600 frames
// counts six times as much as one judged on 100. That is what keeps the number
// honest when limbs see very different amounts of camera time:
//
//   selected score = sum(goodFrames of the selected limbs) / sum(judgedFrames of the
//                    selected limbs) x 100
//
// The same formula combines a single session's limbs (per-session `limbScore`) and
// many sessions (the window averages below). Sessions without a matching limb row
// drop out of every filtered list; they are never counted as 0%.
// ---------------------------------------------------------------------------

const weightedScore = (goodFrames, judgedFrames) => (judgedFrames > 0 ? Math.round((100 * goodFrames) / judgedFrames) : null)

// One session's frame-weighted score across the selected limbs, or null when the
// session has no limb rows for them.
function sessionLimbScore(session, selected) {
  let good = 0
  let judged = 0
  for (const row of session.limbResults ?? []) {
    if (!selected.includes(row.limb)) continue
    good += row.goodFrames
    judged += row.judgedFrames
  }
  return judged > 0 ? { good, judged, score: weightedScore(good, judged) } : null
}

// Per-limb and combined totals for one time window, straight from an aggregation
// over limbResults (scoped to the logged-in user by the caller's `match`).
async function limbWindowTotals(match, selected) {
  const rows = await StretchSession.aggregate([
    { $match: { ...match, 'limbResults.limb': { $in: selected } } },
    { $unwind: '$limbResults' },
    { $match: { 'limbResults.limb': { $in: selected } } },
    {
      $group: {
        _id: '$limbResults.limb',
        good: { $sum: '$limbResults.goodFrames' },
        judged: { $sum: '$limbResults.judgedFrames' },
        sessions: { $addToSet: '$_id' },
      },
    },
  ])
  const byLimb = new Map(rows.map((row) => [row._id, row]))
  let good = 0
  let judged = 0
  const sessionIds = new Set()
  for (const limb of selected) {
    const row = byLimb.get(limb)
    if (!row) continue
    good += row.good
    judged += row.judged
    for (const id of row.sessions) sessionIds.add(String(id))
  }
  return { good, judged, score: weightedScore(good, judged), sessions: sessionIds.size, byLimb }
}

// Everything the filtered dashboard needs: window totals, per-limb breakdown,
// and the matching sessions for the chart and the session log.
async function limbSummary(userId, selected, now) {
  const windowStart = new Date(now.getTime() - 7 * DAY_MS)
  const previousStart = new Date(now.getTime() - 14 * DAY_MS)
  const limbIn = { 'limbResults.limb': { $in: selected } }

  const [current, previous, windowSessions, previousSessions, allTimeSessions, historyDocs, recentDocs] = await Promise.all([
    limbWindowTotals({ user: userId, completedAt: { $gte: windowStart } }, selected),
    limbWindowTotals({ user: userId, completedAt: { $gte: previousStart, $lt: windowStart } }, selected),
    // "Based on N sessions" counts sessions, not limb rows; a session with two
    // selected limbs is still one session.
    StretchSession.countDocuments({ user: userId, completedAt: { $gte: windowStart }, ...limbIn }),
    StretchSession.countDocuments({ user: userId, completedAt: { $gte: previousStart, $lt: windowStart }, ...limbIn }),
    // All-time count decides between "no data at all" (empty state with exercise
    // suggestions) and "nothing in the last 7 days" (score shows a dash).
    StretchSession.countDocuments({ user: userId, ...limbIn }),
    // The chart keeps its "last 14 sessions" rule, but only sessions that involve
    // the selected limbs can appear.
    StretchSession.find({ user: userId, ...limbIn })
      .sort({ completedAt: -1, _id: -1 })
      .limit(HISTORY_SIZE)
      .select('limbResults completedAt'),
    StretchSession.find({ user: userId, ...limbIn })
      .sort({ completedAt: -1, _id: -1 })
      .limit(5)
      .populate('exercise', 'title targetArea videoUrl'),
  ])

  // Breakdown in the config's stable order, so the bars never shuffle.
  const limbBreakdown = LIMBS.filter((limb) => selected.includes(limb.id)).map((limb) => {
    const row = current.byLimb.get(limb.id)
    return {
      limb: limb.id,
      score: row ? weightedScore(row.good, row.judged) : null,
      judgedFrames: row?.judged ?? 0,
      goodFrames: row?.good ?? 0,
      sessions: row?.sessions.length ?? 0,
    }
  })

  return {
    current,
    previousScore: weightedScore(previous.good, previous.judged),
    windowSessions,
    previousSessions,
    allTimeSessions,
    limbBreakdown,
    history: historyDocs.reverse().map((session) => ({
      score: sessionLimbScore(session, selected)?.score ?? null,
      completedAt: session.completedAt,
    })),
    recent: recentDocs.map((session) => ({
      ...session.toObject(),
      limbScore: sessionLimbScore(session, selected)?.score ?? null,
    })),
  }
}

router.get('/', async (req, res) => {
  // ?limbs= is a query string, not a JSON body, so it is parsed here instead of
  // through the validate() middleware. Unknown limb ids return the usual 422 shape.
  const parsed = dashboardQuerySchema.safeParse(req.query)
  if (!parsed.success) return validationError(res, formatIssues(parsed.error.issues))
  const selected = [...new Set(parsed.data.limbs ?? [])]
  const filtered = selected.length > 0

  const userId = req.user._id
  const mine = { user: userId }
  const now = new Date()

  const [totalSessions, lastWeek, weekBefore, thisWeek, areaCounts, triedIds, recent, activeDays, history, limbData] =
    await Promise.all([
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
      // Extra work only when limbs are selected; null keeps the default output.
      filtered ? limbSummary(userId, selected, now) : Promise.resolve(null),
    ])
  const days = new Set(activeDays.map((d) => d._id))

  const suggestions = await pickSuggestions(req.user.painAreas ?? [], triedIds)

  res.json({
    totalSessions,
    // With a limb filter the averages come from the frame-weighted limb totals;
    // without one these are the original session-score averages, unchanged.
    averageScore: filtered ? limbData.current.score : lastWeek[0] ? Math.round(lastWeek[0].avg) : null,
    previousAverageScore: filtered ? limbData.previousScore : weekBefore[0] ? Math.round(weekBefore[0].avg) : null,
    minutesThisWeek: Math.floor((thisWeek[0]?.seconds ?? 0) / 60),
    topArea: areaCounts[0]?._id ?? null,
    topAreaSessions: areaCounts[0]?.total ?? 0,
    streak: computeStreak(days, now),
    recentDays: recentDays(days, now),
    scoreHistory: filtered
      ? limbData.history
      : history.reverse().map((s) => ({ score: s.score, completedAt: s.completedAt })),
    recentSessions: filtered ? limbData.recent : recent,
    suggestions,
    // Limb-filter extras. Empty array when no filter is active, so the client can
    // tell the two modes apart without a second request.
    limbs: selected,
    ...(filtered
      ? {
          limbBreakdown: limbData.limbBreakdown,
          limbSessions: limbData.windowSessions,
          limbPreviousSessions: limbData.previousSessions,
          limbSessionsTotal: limbData.allTimeSessions,
        }
      : {}),
  })
})

export default router
