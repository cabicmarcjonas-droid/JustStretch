import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import authRoutes from '../routes/auth.js'
import dashboardRoutes from '../routes/dashboard.js'
import exerciseRoutes from '../routes/exercises.js'
import profileRoutes from '../routes/profile.js'
import sessionRoutes from '../routes/sessions.js'
import { apiNotFound, errorHandler } from '../middleware/errors.js'

const isProduction = () => process.env.NODE_ENV === 'production'

export function createApp({ mongoUrl }) {
  const app = express()
  app.set('trust proxy', 1)
  // Server-Timing header on every API response: how long the server took, in ms.
  // The client reads it next to its own round-trip time (paper, Table 6: Response Time).
  app.use((req, res, next) => {
    const started = process.hrtime.bigint()
    const writeHead = res.writeHead
    res.writeHead = function (...args) {
      const ms = Number(process.hrtime.bigint() - started) / 1e6
      if (!res.headersSent) res.setHeader('Server-Timing', `app;dur=${ms.toFixed(1)}`)
      return writeHead.apply(this, args)
    }
    next()
  })
  app.use(express.json({ limit: '100kb' }))

  const secret = process.env.SESSION_SECRET || 'dev-only-secret'
  if (isProduction() && secret === 'dev-only-secret') {
    throw new Error('SESSION_SECRET must be set in production.')
  }

  const store = MongoStore.create({ mongoUrl, collectionName: 'sessions', touchAfter: 24 * 3600 })
  app.locals.sessionStore = store

  app.use(
    session({
      name: 'connect.sid',
      secret,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction(),
        // No maxAge: a browser-session cookie unless the user ticks "Remember me".
      },
    }),
  )

  app.use('/api/auth', authRoutes)
  app.use('/api/profile', profileRoutes)
  app.use('/api/exercises', exerciseRoutes)
  app.use('/api/sessions', sessionRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api', apiNotFound)
  app.use(errorHandler)

  return app
}
