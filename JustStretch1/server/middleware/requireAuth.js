import { User } from '../models/User.js'
import { revokeCurrentSession, touchSession } from '../services/sessions.js'

function destroySession(req) {
  return new Promise((resolve) => {
    if (!req.session) return resolve()
    req.session.destroy(() => resolve())
  })
}

async function clearStaleSession(req) {
  await revokeCurrentSession(req)
  await destroySession(req)
}

export async function requireAuth(req, res, next) {
  const userId = req.session?.userId
  if (!userId) return res.status(401).json({ message: 'Unauthenticated.' })

  const user = await User.findById(userId)
  const sessionVersion = Number(req.session.authVersion ?? 0)

  if (!user || sessionVersion !== user.authVersion) {
    await clearStaleSession(req)
    return res.status(401).json({ message: 'Unauthenticated.' })
  }

  req.user = user
  await touchSession(req, user)
  next()
}

export async function requireGuest(req, res, next) {
  if (!req.session?.userId) return next()

  const user = await User.findById(req.session.userId).select('authVersion')
  const sessionVersion = Number(req.session.authVersion ?? 0)

  if (user && sessionVersion === user.authVersion) {
    return res.status(409).json({ message: 'Already logged in.' })
  }

  await clearStaleSession(req)
  next()
}
