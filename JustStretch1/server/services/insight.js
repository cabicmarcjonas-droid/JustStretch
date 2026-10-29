// Narrative recommendation for the dashboard.
//
// Everything that matters is decided here, in code: the best and worst body area,
// the lowest-scoring exercise and whether the member should see a professional (the
// same referral rule as after a session, services/referral.js). Groq only words it
// (services/insightWriter.js); when it is off or fails, templateNarrative() does.
import { Exercise } from '../models/Exercise.js'
import { Insight } from '../models/Insight.js'
import { StretchSession } from '../models/StretchSession.js'
import { REFERRAL_RECENT_SESSIONS, referralMessage } from '../shared/referral.js'
import { areaLabel } from '../shared/enums.js'
import { cleanNarrative } from './insightWriter.js'
import { referralReason, therapistFor } from './referral.js'

// How many of the member's latest sessions the summary looks at.
export const INSIGHT_WINDOW = 30
// A template written because Groq failed is retried after this long (a Groq
// narrative is kept until the sessions change).
const TEMPLATE_RETRY_MS = 10 * 60 * 1000

const average = (scores) => Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)

// Groups sessions by a key and averages their scores, lowest first. Ties go to the
// group with more sessions, then to the key, so the order never flickers.
function rank(sessions, keyOf) {
  const groups = new Map()
  for (const s of sessions) {
    const key = keyOf(s)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(s.score)
  }
  return [...groups.entries()]
    .map(([key, scores]) => ({ key, score: average(scores), sessions: scores.length }))
    .sort((a, b) => a.score - b.score || b.sessions - a.sessions || String(a.key).localeCompare(String(b.key)))
}

// The first area (weakest first) whose recent sessions meet the referral rule.
async function findReferral(userId, areasWeakestFirst) {
  for (const area of areasWeakestFirst) {
    const areaExercises = await Exercise.find({ targetArea: area }).select('_id')
    const recent = await StretchSession.find({ user: userId, exercise: { $in: areaExercises.map((e) => e._id) } })
      .sort({ completedAt: -1, _id: -1 })
      .limit(REFERRAL_RECENT_SESSIONS)
      .select('score fatigue')
    const reason = referralReason(recent)
    if (reason) {
      const therapist = await therapistFor(area)
      return { reason, area, message: referralMessage(reason), therapist }
    }
  }
  return null
}

/** The facts the narrative is built from, or null when the member has no sessions yet. */
export async function insightFacts(userId) {
  const sessions = await StretchSession.find({ user: userId })
    .sort({ completedAt: -1, _id: -1 })
    .limit(INSIGHT_WINDOW)
    .select('score exercise')
    .populate('exercise', 'title targetArea')
  const usable = sessions.filter((s) => s.exercise)
  if (usable.length === 0) return null

  const areas = rank(usable, (s) => s.exercise.targetArea)
  const exercises = rank(usable, (s) => String(s.exercise._id))
  const titleOf = new Map(usable.map((s) => [String(s.exercise._id), s.exercise.title]))

  const worst = areas[0]
  const best = areas.at(-1)
  const lowest = exercises[0]

  return {
    sessionsConsidered: usable.length,
    bestArea: { area: best.key, label: areaLabel(best.key), score: best.score, sessions: best.sessions },
    worstArea: { area: worst.key, label: areaLabel(worst.key), score: worst.score, sessions: worst.sessions },
    lowestExercise: { id: lowest.key, title: titleOf.get(lowest.key), score: lowest.score, sessions: lowest.sessions },
    referral: await findReferral(userId, areas.map((a) => a.key)),
  }
}

// What Groq is given: labels and numbers only, no ids, names or contact details.
export function promptFacts(facts) {
  return {
    sessionsConsidered: facts.sessionsConsidered,
    bestArea: { name: facts.bestArea.label, averageScore: facts.bestArea.score, sessions: facts.bestArea.sessions },
    areaNeedingMostWork: { name: facts.worstArea.label, averageScore: facts.worstArea.score, sessions: facts.worstArea.sessions },
    lowestScoringExercise: { title: facts.lowestExercise.title, averageScore: facts.lowestExercise.score },
    referral: facts.referral ? { area: areaLabel(facts.referral.area), reason: facts.referral.message } : null,
  }
}

// Plain wording used when Groq is not configured or does not answer.
export function templateNarrative(facts) {
  const { bestArea, worstArea, lowestExercise, referral } = facts
  const parts = []
  if (bestArea.area === worstArea.area) {
    parts.push(
      `So far you have only practised your ${bestArea.label.toLowerCase()}, averaging ${bestArea.score}/100, so try a stretch for another area next.`,
    )
  } else {
    parts.push(
      `Your strongest area is your ${bestArea.label.toLowerCase()} at ${bestArea.score}/100, and the one that needs the most work is your ${worstArea.label.toLowerCase()} at ${worstArea.score}/100.`,
    )
  }
  parts.push(`Repeating ${lowestExercise.title} (${lowestExercise.score}/100) is a good way to bring your score up.`)
  if (referral) {
    parts.push(
      `Your recent ${areaLabel(referral.area).toLowerCase()} scores suggest checking in with a physical therapist; their contact details are below.`,
    )
  }
  return parts.join(' ')
}

// Changes whenever a session is added, removed or edited.
async function sessionsVersion(userId) {
  const [count, latest] = await Promise.all([
    StretchSession.countDocuments({ user: userId }),
    StretchSession.findOne({ user: userId }).sort({ updatedAt: -1, _id: -1 }).select('updatedAt'),
  ])
  return `${count}:${latest?._id ?? 'none'}:${latest?.updatedAt?.getTime() ?? 0}`
}

/**
 * The dashboard insight: the narrative plus the facts the card shows next to it.
 * The narrative is cached in Insight and only rewritten when the sessions change.
 */
export async function getInsight(userId, writer) {
  const facts = await insightFacts(userId)
  if (!facts) return { narrative: null, source: null }

  const basedOn = await sessionsVersion(userId)
  const cached = await Insight.findOne({ user: userId })
  const retryTemplate =
    cached?.source === 'template' && writer?.enabled && Date.now() - cached.generatedAt.getTime() >= TEMPLATE_RETRY_MS

  let narrative = cached?.narrative
  let source = cached?.source
  if (!cached || cached.basedOn !== basedOn || retryTemplate) {
    const written = cleanNarrative(await writer?.write(promptFacts(facts)))
    narrative = written ?? templateNarrative(facts)
    source = written ? 'groq' : 'template'
    await Insight.findOneAndUpdate(
      { user: userId },
      { $set: { basedOn, narrative, source, generatedAt: new Date() } },
      { upsert: true },
    )
  }

  return {
    narrative,
    source,
    bestArea: facts.bestArea,
    worstArea: facts.worstArea,
    lowestExercise: facts.lowestExercise,
    referral: facts.referral,
  }
}
