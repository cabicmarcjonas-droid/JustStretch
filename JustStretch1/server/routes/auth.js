import bcrypt from 'bcrypt'
import { Router } from 'express'
import { deleteUser } from '../models/cascade.js'
import { EmailVerificationChallenge } from '../models/EmailVerificationChallenge.js'
import { PasswordResetToken } from '../models/PasswordResetToken.js'
import { User } from '../models/User.js'
import { requireGuest } from '../middleware/requireAuth.js'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../middleware/schemas.js'
import { validate, validationError } from '../middleware/validate.js'
import { authLog } from '../services/authLog.js'
import {
  CODE_TTL_MINUTES,
  consumeVerificationCode,
  invalidateVerificationChallenge,
  maskEmail,
  RESEND_COOLDOWN_MS,
  resendVerificationChallenge,
  sendVerificationChallenge,
} from '../services/emailVerification.js'
import { consumePasswordReset, findPasswordReset, issuePasswordReset } from '../services/passwordReset.js'
import {
  createSessionRecord,
  REMEMBER_MS,
  revokeAllSessionsForUser,
  revokeCurrentSession,
} from '../services/sessions.js'

const router = Router()

const limit = (name) => (req, res, next) => req.app.locals.rateLimits[name](req, res, next)

const signIn = (req, user, remember = false) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err)
      req.session.userId = String(user._id)
      req.session.authVersion = user.authVersion
      if (remember) req.session.cookie.maxAge = REMEMBER_MS
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()))
    })
  })

const savePending = (req, pending) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err)
      req.session.pendingVerification = pending
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()))
    })
  })

const destroySession = (req) =>
  new Promise((resolve) => {
    if (!req.session) return resolve()
    req.session.destroy(() => resolve())
  })

const clearCookie = (res) => res.clearCookie('connect.sid')

function verificationResponse(pending, extra = {}) {
  return {
    verificationRequired: true,
    email: maskEmail(pending.email),
    source: pending.source,
    expiresInSeconds: CODE_TTL_MINUTES * 60,
    resendAfterSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    ...extra,
  }
}

async function beginVerification(req, user, { source, remember = false }) {
  const { pending } = await sendVerificationChallenge({
    user,
    source,
    remember,
    ip: req.ip,
    secret: req.app.locals.config.sessionSecret,
    mailer: req.app.locals.mailer,
  })
  await savePending(req, pending)
  authLog('verification_sent', { email: user.email, source })
  return pending
}

router.post('/register', limit('register'), requireGuest, validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body

  if (await User.exists({ email })) {
    return validationError(res, { email: ['The email has already been taken.'] })
  }

  let user
  try {
    user = await User.create({ name, email, password: await bcrypt.hash(password, 10) })
  } catch (error) {
    if (error?.code === 11000) return validationError(res, { email: ['The email has already been taken.'] })
    throw error
  }

  try {
    const pending = await beginVerification(req, user, { source: 'register' })
    return res.status(201).json(verificationResponse(pending))
  } catch (error) {
    console.error('[auth] verification email could not be sent', error.message)
    await deleteUser(user._id)
    authLog('register_failed', { email, reason: 'mail_delivery' })
    return res.status(503).json({ message: 'We could not send the verification email. Please try again shortly.' })
  }
})

router.post('/login', limit('login'), requireGuest, validate(loginSchema), async (req, res) => {
  const { email, password, remember } = req.body
  const user = await User.findOne({ email }).select('+password')

  const hash = user?.password ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi'
  const matches = await bcrypt.compare(password, hash)

  if (!user || !matches) {
    authLog('login_failed', { email, reason: 'credentials' })
    return validationError(res, { email: ['These credentials do not match our records.'] })
  }

  if (!user.emailVerifiedAt) {
    try {
      const pending = await beginVerification(req, user, { source: 'login', remember: remember === true })
      return res.json(verificationResponse(pending))
    } catch (error) {
      console.error('[auth] verification email could not be sent', error.message)
      authLog('login_failed', { email, reason: 'mail_delivery' })
      return res.status(503).json({ message: 'We could not send the verification email. Please try again shortly.' })
    }
  }

  await signIn(req, user, remember === true)
  await createSessionRecord(req, user, remember === true)
  authLog('login_succeeded', { email })
  res.json({ user })
})

router.post('/verify-email', limit('verifyEmail'), validate(verifyEmailSchema), async (req, res) => {
  const pending = req.session?.pendingVerification
  if (!pending) {
    return res.status(401).json({ message: 'Your verification session has expired. Please log in again.' })
  }

  const result = await consumeVerificationCode({
    pending,
    code: req.body.code,
    secret: req.app.locals.config.sessionSecret,
  })

  if (!result.ok) {
    const messages = {
      invalid: 'The verification code is incorrect.',
      expired: 'The verification code has expired. Request a new one.',
      too_many_attempts: 'Too many incorrect attempts. Request a new code.',
    }
    if (result.reason === 'too_many_attempts') {
      return res.status(429).json({ message: messages[result.reason], errors: { code: [messages[result.reason]] } })
    }
    authLog('verification_failed', { email: pending.email, reason: result.reason })
    return validationError(res, { code: [messages[result.reason] ?? messages.invalid] })
  }

  const user = await User.findById(pending.userId)
  if (!user || user.email !== result.challenge.email || user.email !== pending.email) {
    await destroySession(req)
    clearCookie(res)
    return res.status(401).json({ message: 'Your verification session has expired. Please log in again.' })
  }

  if (!user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date()
    await user.save()
  }

  const remember = pending.remember === true
  await signIn(req, user, remember)
  await createSessionRecord(req, user, remember)
  authLog('verification_succeeded', { email: user.email })
  res.json({ user })
})

router.post('/resend-verification', limit('resendVerification'), async (req, res) => {
  const pending = req.session?.pendingVerification
  if (!pending) {
    return res.status(401).json({ message: 'Your verification session has expired. Please log in again.' })
  }

  const user = await User.findById(pending.userId)
  if (!user) {
    await destroySession(req)
    clearCookie(res)
    return res.status(401).json({ message: 'Your verification session has expired. Please log in again.' })
  }
  if (user.emailVerifiedAt) {
    await destroySession(req)
    clearCookie(res)
    return res.status(409).json({ message: 'This email is already verified. Please log in.' })
  }

  let result
  try {
    result = await resendVerificationChallenge({
      pending,
      secret: req.app.locals.config.sessionSecret,
      mailer: req.app.locals.mailer,
      name: user.name,
    })
  } catch (error) {
    console.error('[auth] verification email could not be resent', error.message)
    return res.status(503).json({ message: 'We could not send the verification email. Please try again shortly.' })
  }

  if (!result.ok) {
    if (result.reason === 'cooldown') {
      return res.status(429).json({
        message: `Please wait ${result.retryAfterSeconds} seconds before requesting another code.`,
        retryAfterSeconds: result.retryAfterSeconds,
      })
    }
    if (result.reason === 'send_limit') {
      return res.status(429).json({ message: 'You have reached the limit for this verification code. Please log in again.' })
    }
    await destroySession(req)
    clearCookie(res)
    return res.status(401).json({ message: 'Your verification session has expired. Please log in again.' })
  }

  authLog('verification_resent', { email: pending.email })
  res.json({
    ok: true,
    email: maskEmail(pending.email),
    expiresInSeconds: CODE_TTL_MINUTES * 60,
    resendAfterSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
  })
})

router.post('/cancel-verification', async (req, res) => {
  if (req.session?.pendingVerification) {
    await invalidateVerificationChallenge(req.session.pendingVerification)
  }
  await destroySession(req)
  clearCookie(res)
  res.json({ ok: true })
})

router.post('/logout', async (req, res) => {
  await revokeCurrentSession(req)
  await destroySession(req)
  clearCookie(res)
  res.json({ ok: true })
})

router.get('/me', async (req, res) => {
  const userId = req.session?.userId
  if (userId) {
    const user = await User.findById(userId)
    if (user && Number(req.session.authVersion ?? 0) === user.authVersion) {
      return res.json({ user })
    }
    await revokeCurrentSession(req)
    await destroySession(req)
    return res.json({ user: null })
  }

  const pending = req.session?.pendingVerification
  if (pending) {
    const user = await User.findById(pending.userId)
    if (user && !user.emailVerifiedAt && user.email === pending.email) {
      return res.json({ user: null, ...verificationResponse(pending) })
    }
    delete req.session.pendingVerification
  }

  res.json({ user: null })
})

router.post('/forgot-password', limit('forgotPassword'), validate(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })
  const message = 'If an account exists for that email, we sent a password reset link.'

  if (user) {
    try {
      await issuePasswordReset({
        userId: user._id,
        appUrl: req.app.locals.config.appUrl,
        ip: req.ip,
        mailer: req.app.locals.mailer,
        name: user.name,
        email: user.email,
      })
      authLog('password_reset_requested', { email })
    } catch (error) {
      console.error('[auth] password reset email could not be sent', error.message)
    }
  }

  res.json({ message })
})

router.post('/reset-password', limit('resetPassword'), validate(resetPasswordSchema), async (req, res) => {
  const { token, password } = req.body
  const tokenRecord = await findPasswordReset(token)
  if (!tokenRecord) {
    return validationError(res, { token: ['This password reset link is invalid or has expired.'] })
  }

  const consumed = await consumePasswordReset(tokenRecord._id)
  if (!consumed) {
    return validationError(res, { token: ['This password reset link is invalid or has expired.'] })
  }

  const user = await User.findById(tokenRecord.user)
  if (!user) {
    return validationError(res, { token: ['This password reset link is invalid or has expired.'] })
  }

  user.password = await bcrypt.hash(password, 10)
  user.passwordChangedAt = new Date()
  user.emailVerifiedAt = new Date()
  user.authVersion += 1
  await user.save()

  await Promise.all([
    PasswordResetToken.deleteMany({ user: user._id }),
    EmailVerificationChallenge.deleteMany({ user: user._id }),
  ])
  await revokeAllSessionsForUser(req.app, user._id)
  authLog('password_reset_completed', { email: user.email })
  res.json({ ok: true })
})

export default router
