import { User } from '../models/User.js'

// 401 for anyone without a session. The client turns this into a redirect to /login.
export async function requireAuth(req, res, next) {
  const userId = req.session?.userId
  const user = userId ? await User.findById(userId) : null

  if (!user) {
    return res.status(401).json({ message: 'Unauthenticated.' })
  }

  req.user = user
  next()
}

export async function requireGuest(req, res, next) {
  if (req.session?.userId && (await User.exists({ _id: req.session.userId }))) {
    return res.status(409).json({ message: 'Already logged in.' })
  }
  next()
}
