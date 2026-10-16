import bcrypt from 'bcrypt'
import { Router } from 'express'
import { deleteUser } from '../models/cascade.js'
import { User } from '../models/User.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { deleteAccountSchema, passwordSchema, profileSchema } from '../middleware/schemas.js'
import { validate, validationError } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth)

router.patch('/', validate(profileSchema), async (req, res) => {
  const { name, email } = req.body

  const taken = await User.exists({ email, _id: { $ne: req.user._id } })
  if (taken) return validationError(res, { email: ['The email has already been taken.'] })

  req.user.name = name
  req.user.email = email
  await req.user.save()
  res.json({ user: req.user })
})

router.put('/password', validate(passwordSchema), async (req, res) => {
  const { currentPassword, password } = req.body

  if (!(await bcrypt.compare(currentPassword, req.user.password))) {
    return validationError(res, { currentPassword: ['The password is incorrect.'] })
  }

  req.user.password = await bcrypt.hash(password, 10)
  await req.user.save()
  res.json({ ok: true })
})

router.delete('/', validate(deleteAccountSchema), async (req, res, next) => {
  if (!(await bcrypt.compare(req.body.password, req.user.password))) {
    return validationError(res, { password: ['The password is incorrect.'] })
  }

  await deleteUser(req.user._id)
  req.session.destroy((err) => {
    if (err) return next(err)
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

export default router
