import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { EmailVerificationChallenge } from '../models/EmailVerificationChallenge.js'

export const CODE_TTL_MS = 10 * 60 * 1000
export const CODE_TTL_MINUTES = 10
export const RESEND_COOLDOWN_MS = 60 * 1000
export const MAX_SENDS = 3
export const MAX_ATTEMPTS = 5

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

function hashCode(secret, challengeId, code) {
  return createHmac('sha256', secret).update(`${challengeId}:${code}`).digest('hex')
}

function hashesMatch(expected, actual) {
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(actual, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export function maskEmail(email) {
  const [local, domain] = String(email).split('@')
  if (!domain) return 'your email'
  const visible = local.slice(0, 1)
  return `${visible}${'*'.repeat(Math.max(3, Math.min(8, local.length - 1)))}@${domain}`
}

export async function createVerificationChallenge({ userId, email, source, ip = '', secret }) {
  const pendingId = randomBytes(16).toString('hex')
  const challengeId = randomBytes(16).toString('hex')
  const code = generateCode()
  const now = new Date()

  await EmailVerificationChallenge.deleteMany({ user: userId, consumedAt: null })

  const challenge = await EmailVerificationChallenge.create({
    user: userId,
    pendingId,
    challengeId,
    codeHash: hashCode(secret, challengeId, code),
    email,
    source,
    expiresAt: new Date(now.getTime() + CODE_TTL_MS),
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    sendCount: 1,
    lastSentAt: now,
    requestedIp: ip,
  })

  return { challenge, pendingId, code }
}

export async function sendVerificationChallenge({ user, source, ip, secret, mailer, remember = false }) {
  const { challenge, pendingId, code } = await createVerificationChallenge({
    userId: user._id,
    email: user.email,
    source,
    ip,
    secret,
  })

  try {
    await mailer.sendVerificationCode({
      to: user.email,
      name: user.name,
      code,
      expiresMinutes: CODE_TTL_MINUTES,
    })
  } catch (error) {
    await EmailVerificationChallenge.deleteOne({ _id: challenge._id })
    throw error
  }

  return {
    challenge,
    pending: {
      userId: String(user._id),
      pendingId,
      challengeId: challenge.challengeId,
      email: user.email,
      source,
      remember,
      createdAt: new Date().toISOString(),
    },
  }
}

export async function resendVerificationChallenge({ pending, secret, mailer, name = '' }) {
  const challenge = await EmailVerificationChallenge.findOne({
    user: pending.userId,
    pendingId: pending.pendingId,
    challengeId: pending.challengeId,
    consumedAt: null,
  })

  if (!challenge) return { ok: false, reason: 'invalid' }
  if (challenge.sendCount >= MAX_SENDS) return { ok: false, reason: 'send_limit' }

  const waitMs = challenge.lastSentAt.getTime() + RESEND_COOLDOWN_MS - Date.now()
  if (waitMs > 0) return { ok: false, reason: 'cooldown', retryAfterSeconds: Math.ceil(waitMs / 1000) }

  const code = generateCode()
  const now = new Date()
  const result = await EmailVerificationChallenge.updateOne(
    { _id: challenge._id, consumedAt: null, sendCount: challenge.sendCount },
    {
      $set: {
        codeHash: hashCode(secret, challenge.challengeId, code),
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
        lastSentAt: now,
        attempts: 0,
      },
      $inc: { sendCount: 1 },
    },
  )

  if (result.modifiedCount !== 1) return { ok: false, reason: 'send_limit' }

  await mailer.sendVerificationCode({
    to: challenge.email,
    name,
    code,
    expiresMinutes: CODE_TTL_MINUTES,
  })

  return { ok: true, expiresAt: new Date(now.getTime() + CODE_TTL_MS) }
}

export async function consumeVerificationCode({ pending, code, secret }) {
  const challenge = await EmailVerificationChallenge.findOne({
    user: pending.userId,
    pendingId: pending.pendingId,
    challengeId: pending.challengeId,
    consumedAt: null,
  })

  if (!challenge) return { ok: false, reason: 'invalid' }
  if (challenge.expiresAt.getTime() <= Date.now()) return { ok: false, reason: 'expired' }
  if (challenge.attempts >= challenge.maxAttempts) return { ok: false, reason: 'too_many_attempts' }

  const expected = challenge.codeHash
  const actual = hashCode(secret, challenge.challengeId, code)

  if (!hashesMatch(expected, actual)) {
    const updated = await EmailVerificationChallenge.findOneAndUpdate(
      { _id: challenge._id, consumedAt: null, attempts: { $lt: challenge.maxAttempts } },
      { $inc: { attempts: 1 } },
      { returnDocument: 'after' },
    )
    return {
      ok: false,
      reason: updated && updated.attempts >= updated.maxAttempts ? 'too_many_attempts' : 'invalid',
      attemptsRemaining: updated ? Math.max(0, updated.maxAttempts - updated.attempts) : 0,
    }
  }

  const consumed = await EmailVerificationChallenge.findOneAndUpdate(
    { _id: challenge._id, consumedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { consumedAt: new Date() } },
    { returnDocument: 'after' },
  )

  if (!consumed) return { ok: false, reason: 'expired' }

  await EmailVerificationChallenge.updateMany(
    { user: challenge.user, _id: { $ne: challenge._id }, consumedAt: null },
    { $set: { consumedAt: new Date() } },
  )

  return { ok: true, challenge: consumed }
}

export async function invalidateVerificationChallenge(pending) {
  if (!pending?.challengeId) return
  await EmailVerificationChallenge.updateOne({ challengeId: pending.challengeId, consumedAt: null }, { $set: { consumedAt: new Date() } })
}
