import express from 'express'
import helmet from 'helmet'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import authRoutes from '../routes/auth.js'
import authSessionRoutes from '../routes/authSessions.js'
import dashboardRoutes from '../routes/dashboard.js'
import exerciseRoutes from '../routes/exercises.js'
import profileRoutes from '../routes/profile.js'
import sessionRoutes from '../routes/sessions.js'
import { apiNotFound, errorHandler } from '../middleware/errors.js'
import { noStore } from '../middleware/noStore.js'
import { createRateLimiters } from '../middleware/rateLimits.js'
import { sameOrigin } from '../middleware/sameOrigin.js'
import { createMailer } from '../services/mailer.js'
import { loadConfig } from './config.js'

export function createApp({ mongoUrl, config = loadConfig(), mailer = createMailer(config), rateLimits = true } = {}) {
  const app = express()
  app.locals.config = config
  app.locals.mailer = mailer
  app.locals.rateLimits = createRateLimiters({ enabled: rateLimits })

  app.set('trust proxy', config.trustProxy)
  app.use(helmet())
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
  app.use(sameOrigin(config))

  const store = MongoStore.create({ mongoUrl, collectionName: 'sessions', touchAfter: 24 * 3600 })
  app.locals.sessionStore = store

  app.use(
    session({
      name: 'connect.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.isProduction,
        // No maxAge: a browser-session cookie unless the user ticks "Remember me".
      },
    }),
  )

  app.use('/api/auth', noStore, authSessionRoutes)
  app.use('/api/auth', noStore, authRoutes)
  app.use('/api/profile', noStore, profileRoutes)
  app.use('/api/exercises', exerciseRoutes)
  app.use('/api/sessions', sessionRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api', apiNotFound)
  app.use(errorHandler)

  return app
}
