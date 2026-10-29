import bcrypt from 'bcrypt'
import { Router } from 'express'
import { deleteUser } from '../models/cascade.js'
import { User } from '../models/User.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  bodyMapSchema,
  deleteAccountSchema,
  emailChangeSchema,
  passwordSchema,
  profileSchema,
} from '../middleware/schemas.js'
import { validate, validationError } from '../middleware/validate.js'
import { authLog } from '../services/authLog.js'
import { maskEmail } from '../services/emailVerification.js'
import { revokeAllSessionsForUser, revokeOtherSessions } from '../services/sessions.js'

const router = Router()
router.use(requireAuth)

const sensitive = (req, res, next) => req.app.locals.rateLimits.sensitive(req, res, next)

function destroySession(req) {
  return new Promise((resolve) => {
    if (!req.session) return resolve()
    req.session.destroy(() => resolve())
  })
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()))
  })
}

router.get('/', (req, res) => {
  res.json({ user: req.user })
})

router.put('/', validate(bodyMapSchema), async (req, res) => {
  if (req.body.painAreas !== undefined) {
    req.user.painAreas = req.body.painAreas
  }
  if (req.body.baseline !== undefined) {
    req.user.baseline = {
      assessedAt: req.body.baseline.assessedAt === undefined ? new Date() : req.body.baseline.assessedAt,
      measurements: req.body.baseline.measurements ?? [],
    }
  }

  await req.user.save()
  res.json({ user: req.user })
})

router.patch('/', validate(profileSchema), async (req, res) => {
  req.user.name = req.body.name
  await req.user.save()
  res.json({ user: req.user })
})

router.put('/email', sensitive, validate(emailChangeSchema), async (req, res) => {
  const { email, currentPassword } = req.body
  const user = await User.findById(req.user._id).select('+password')

  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return validationError(res, { currentPassword: ['The password is incorrect.'] })
  }
  if (user.email === email) {
    return validationError(res, { email: ['The new email must be different from your current email.'] })
  }

  const taken = await User.exists({ email, _id: { $ne: user._id } })
  if (taken) return validationError(res, { email: ['The email has already been taken.'] })

  user.email = email
  user.emailVerifiedAt = null
  user.authVersion += 1
  try {
    await user.save()
  } catch (error) {
    if (error?.code === 11000) return validationError(res, { email: ['The email has already been taken.'] })
    throw error
  }

  await revokeAllSessionsForUser(req.app, user._id)
  await destroySession(req)
  res.clearCookie('connect.sid')
  authLog('email_changed', { email })
  res.json({
    ok: true,
    loggedOut: true,
    email: maskEmail(email),
    message: 'Email updated. Sign in with your new email to verify it.',
  })
})

router.put('/password', sensitive, validate(passwordSchema), async (req, res) => {
  const { currentPassword, password } = req.body
  const user = await User.findById(req.user._id).select('+password')

  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return validationError(res, { currentPassword: ['The password is incorrect.'] })
  }

  user.password = await bcrypt.hash(password, 10)
  user.passwordChangedAt = new Date()
  user.authVersion += 1
  await user.save()

  await revokeOtherSessions(req, user._id)
  req.session.authVersion = user.authVersion
  await saveSession(req)
  authLog('password_changed', { email: user.email })
  res.json({ ok: true })
})

router.delete('/', sensitive, validate(deleteAccountSchema), async (req, res) => {
  const user = await User.findById(req.user._id).select('+password')

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return validationError(res, { password: ['The password is incorrect.'] })
  }

  await deleteUser(user._id)
  await revokeAllSessionsForUser(req.app, user._id)
  await destroySession(req)
  res.clearCookie('connect.sid')
  authLog('account_deleted', { email: user.email })
  res.json({ ok: true })
})

export default router
