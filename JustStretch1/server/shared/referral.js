// The referral threshold (paper, 4.1.3): after a session is saved, the backend
// looks at the member's most recent sessions for the same body area. If every
// one of them shows the same problem, the member is shown a physical
// therapist's contact details.
//
// Change the numbers here; the backend and the tests both read them.

// How many recent sessions in the same body area are compared, the new one included.
export const REFERRAL_RECENT_SESSIONS = 3

// "Persistent form errors": every recent session scored below this (0-100).
export const REFERRAL_LOW_SCORE = 50

// "Exercise difficulty": every recent session was rated at least this tired (1-5).
export const REFERRAL_HIGH_FATIGUE = 4

export const REFERRAL_REASONS = {
  low_scores: 'Your last {n} sessions for this area all scored below {score}.',
  high_fatigue: 'You rated yourself very tired ({fatigue} or more out of 5) in your last {n} sessions for this area.',
}

export const REFERRAL_REASON_VALUES = Object.keys(REFERRAL_REASONS)

export function referralMessage(reason) {
  return (REFERRAL_REASONS[reason] ?? '')
    .replace('{n}', String(REFERRAL_RECENT_SESSIONS))
    .replace('{score}', String(REFERRAL_LOW_SCORE))
    .replace('{fatigue}', String(REFERRAL_HIGH_FATIGUE))
}
