import { Router } from 'express'
import { isValidId, notFound } from '../middleware/errors.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { authLog } from '../services/authLog.js'
import {
  listUserSessions,
  revokeAllSessionsForUser,
  revokeOtherSessions,
  revokeUserSession,
} from '../services/sessions.js'

const router = Router()

function destroySession(req) {
  return new Promise((resolve) => {
    if (!req.session) return resolve()
    req.session.destroy(() => resolve())
  })
}

router.get('/sessions', requireAuth, async (req, res) => {
  const data = await listUserSessions(req, req.user._id)
  res.json({ data })
})

router.delete('/sessions/:id', requireAuth, async (req, res) => {
  if (!isValidId(req.params.id)) return notFound(res)

  const result = await revokeUserSession(req, req.user._id, req.params.id)
  if (!result) return notFound(res)

  if (result.current) {
    await destroySession(req)
    res.clearCookie('connect.sid')
  }

  authLog('session_revoked', { email: req.user.email, current: result.current })
  res.json({ ok: true, current: result.current })
})

router.post('/logout-others', requireAuth, async (req, res) => {
  const count = await revokeOtherSessions(req, req.user._id)
  authLog('sessions_revoked_others', { email: req.user.email, count })
  res.json({ ok: true, count })
})

router.post('/logout-all', requireAuth, async (req, res) => {
  const count = await revokeAllSessionsForUser(req.app, req.user._id)
  await destroySession(req)
  res.clearCookie('connect.sid')
  authLog('sessions_revoked_all', { email: req.user.email, count })
  res.json({ ok: true, count })
})

export default router
