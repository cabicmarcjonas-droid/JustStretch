import bcrypt from 'bcrypt'
import { Router } from 'express'
import { User } from '../models/User.js'
import { requireAuth, requireGuest } from '../middleware/requireAuth.js'
import { loginSchema, registerSchema } from '../middleware/schemas.js'
import { validate, validationError } from '../middleware/validate.js'

const router = Router()

const REMEMBER_MS = 1000 * 60 * 60 * 24 * 30

// Fresh session id on login/register, like Laravel's session()->regenerate().
// "Remember me" turns the browser-session cookie into a 30-day one.
const signIn = (req, user, remember = false) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err)
      req.session.userId = String(user._id)
      if (remember) req.session.cookie.maxAge = REMEMBER_MS
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()))
    })
  })

router.post('/register', requireGuest, validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body

  if (await User.exists({ email })) {
    return validationError(res, { email: ['The email has already been taken.'] })
  }

  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) })
  await signIn(req, user)
  res.status(201).json({ user })
})

router.post('/login', requireGuest, validate(loginSchema), async (req, res) => {
  const { email, password, remember } = req.body
  const user = await User.findOne({ email })

  // Always compare, so response time does not reveal whether the email exists.
  const hash = user?.password ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi'
  const matches = await bcrypt.compare(password, hash)

  if (!user || !matches) {
    return validationError(res, { email: ['These credentials do not match our records.'] })
  }

  await signIn(req, user, remember === true)
  res.json({ user })
})

router.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err)
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

router.get('/me', async (req, res) => {
  const user = req.session?.userId ? await User.findById(req.session.userId) : null
  res.json({ user: user ?? null })
})

export default router
