import { UserSession } from '../models/UserSession.js'

export const REMEMBER_MS = 1000 * 60 * 60 * 24 * 30
export const SESSION_MS = 1000 * 60 * 60 * 24 * 14
const TOUCH_INTERVAL_MS = 1000 * 60 * 60

export function sessionMetadata(req) {
  return {
    userAgent: String(req.get('user-agent') ?? '').slice(0, 500),
    ip: String(req.ip ?? '').slice(0, 100),
  }
}

export async function createSessionRecord(req, user, remember = false) {
  const now = new Date()
  const meta = sessionMetadata(req)
  await UserSession.findOneAndUpdate(
    { sessionId: req.sessionID },
    {
      $set: {
        user: user._id,
        ...meta,
        lastSeenAt: now,
        expiresAt: new Date(now.getTime() + (remember ? REMEMBER_MS : SESSION_MS)),
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  )
}

export async function touchSession(req, user) {
  const now = new Date()
  const record = await UserSession.findOne({ sessionId: req.sessionID }).select('lastSeenAt')
  if (!record) {
    await createSessionRecord(req, user, Boolean(req.session.cookie.maxAge))
    return
  }
  if (now.getTime() - record.lastSeenAt.getTime() >= TOUCH_INTERVAL_MS) {
    await UserSession.updateOne({ _id: record._id }, { $set: { lastSeenAt: now, user: user._id } })
  }
}

function destroyStoredSession(app, sessionId) {
  return new Promise((resolve) => {
    app.locals.sessionStore.destroy(sessionId, (error) => {
      if (error) console.error('[auth] could not destroy stored session', error.message)
      resolve()
    })
  })
}

async function destroyStoredSessions(app, records) {
  await Promise.all(records.map((record) => destroyStoredSession(app, record.sessionId)))
}

export async function listUserSessions(req, userId) {
  const now = new Date()
  await UserSession.deleteMany({ user: userId, expiresAt: { $lte: now } })
  const records = await UserSession.find({ user: userId, expiresAt: { $gt: now } }).sort({ lastSeenAt: -1, createdAt: -1 })
  return records.map((record) => ({
    id: String(record._id),
    current: record.sessionId === req.sessionID,
    userAgent: record.userAgent,
    ip: record.ip,
    createdAt: record.createdAt,
    lastSeenAt: record.lastSeenAt,
    expiresAt: record.expiresAt,
  }))
}

export async function revokeUserSession(req, userId, id) {
  const record = await UserSession.findOne({ _id: id, user: userId })
  if (!record) return null
  await UserSession.deleteOne({ _id: record._id })
  await destroyStoredSession(req.app, record.sessionId)
  return { current: record.sessionId === req.sessionID }
}

export async function revokeOtherSessions(req, userId) {
  const records = await UserSession.find({ user: userId, sessionId: { $ne: req.sessionID } }).select('sessionId')
  await UserSession.deleteMany({ user: userId, sessionId: { $ne: req.sessionID } })
  await destroyStoredSessions(req.app, records)
  return records.length
}

export async function revokeAllSessionsForUser(app, userId) {
  const records = await UserSession.find({ user: userId }).select('sessionId')
  await UserSession.deleteMany({ user: userId })
  await destroyStoredSessions(app, records)
  return records.length
}

export async function revokeCurrentSession(req) {
  await UserSession.deleteOne({ sessionId: req.sessionID })
}
