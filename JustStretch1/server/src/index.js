import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { connectDb, disconnectDb, getMongoUrl } from './db.js'
import { backfillEmailVerification } from './migrations.js'
import { Therapist } from '../models/Therapist.js'
import { seedTherapists } from './seed.js'
import { createMailer } from '../services/mailer.js'

const port = Number(process.env.PORT) || 3001
const config = loadConfig()

await connectDb()

const migrated = await backfillEmailVerification()
if (migrated > 0) console.log(`[api] grandfathered ${migrated} existing account(s) as email verified`)

if ((await Therapist.estimatedDocumentCount()) === 0) {
  const added = await seedTherapists()
  console.log(`[api] added ${added.length} sample therapists for referrals`)
}

const mailer = createMailer(config)
const app = createApp({ mongoUrl: getMongoUrl(), config, mailer })
console.log(`[api] mail transport: ${config.mail.transport}`)

const server = app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`)
})

async function shutdown() {
  server.close()
  await mailer.close()
  await app.locals.sessionStore.close()
  await disconnectDb()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
