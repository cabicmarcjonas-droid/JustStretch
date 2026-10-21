// Progress Evaluation and Therapist Referral (paper, 4.1.3).
// Called right after a session is stored.
import { Exercise } from '../models/Exercise.js'
import { StretchSession } from '../models/StretchSession.js'
import { Therapist } from '../models/Therapist.js'
import {
  REFERRAL_HIGH_FATIGUE,
  REFERRAL_LOW_SCORE,
  REFERRAL_RECENT_SESSIONS,
  referralMessage,
} from '../shared/referral.js'

// Which rule the recent sessions meet, or null. Low scores are checked first
// because they come from the tracker (or the member's own form score), while
// fatigue is self-reported.
export function referralReason(recent) {
  if (recent.length < REFERRAL_RECENT_SESSIONS) return null
  if (recent.every((s) => s.score < REFERRAL_LOW_SCORE)) return 'low_scores'
  if (recent.every((s) => s.fatigue != null && s.fatigue >= REFERRAL_HIGH_FATIGUE)) return 'high_fatigue'
  return null
}

// A therapist for this body area: a specialist first, then a general practice,
// then anyone. Sorted by name so the same member always gets the same contact.
export async function therapistFor(area) {
  return (
    (await Therapist.findOne({ areas: area }).sort({ name: 1 })) ??
    (await Therapist.findOne({ areas: { $size: 0 } }).sort({ name: 1 })) ??
    (await Therapist.findOne().sort({ name: 1 }))
  )
}

/**
 * Compares the member's recent sessions in the exercise's body area with the
 * threshold. When it is met, stores a referral flag on the new session.
 *
 * @returns the referral ({ reason, area, message, therapist }) or null.
 */
export async function evaluateReferral(session, exercise) {
  const area = exercise.targetArea
  const areaExercises = await Exercise.find({ targetArea: area }).select('_id')

  const recent = await StretchSession.find({
    user: session.user,
    exercise: { $in: areaExercises.map((e) => e._id) },
  })
    .sort({ completedAt: -1, _id: -1 })
    .limit(REFERRAL_RECENT_SESSIONS)
    .select('score fatigue')

  const reason = referralReason(recent)
  if (!reason) return null

  const therapist = await therapistFor(area)
  session.referral = { reason, area, therapist: therapist?._id ?? null, flaggedAt: new Date() }
  await session.save()

  return { reason, area, message: referralMessage(reason), therapist }
}
