import { createHash, randomBytes } from 'node:crypto'
import { PasswordResetToken } from '../models/PasswordResetToken.js'

export const RESET_TTL_MS = 60 * 60 * 1000
export const RESET_TTL_MINUTES = 60

export function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function buildResetUrl(appUrl, token) {
  return `${String(appUrl).replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
}

export async function issuePasswordReset({ userId, appUrl, ip = '', mailer, name, email }) {
  const token = randomBytes(32).toString('hex')
  const now = new Date()

  await PasswordResetToken.deleteMany({ user: userId })
  await PasswordResetToken.create({
    user: userId,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(now.getTime() + RESET_TTL_MS),
    requestedIp: ip,
  })

  const resetUrl = buildResetUrl(appUrl, token)
  await mailer.sendPasswordReset({
    to: email,
    name,
    resetUrl,
    expiresMinutes: RESET_TTL_MINUTES,
  })

  return { token, resetUrl }
}

export async function findPasswordReset(token) {
  if (!/^[a-f0-9]{64}$/i.test(String(token))) return null
  return PasswordResetToken.findOne({
    tokenHash: hashResetToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  })
}

export async function consumePasswordReset(tokenRecordId) {
  return PasswordResetToken.findOneAndUpdate(
    { _id: tokenRecordId, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { returnDocument: 'after' },
  )
}
