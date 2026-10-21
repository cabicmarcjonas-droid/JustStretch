import { createApp } from './app.js'
import { connectDb, disconnectDb, getMongoUrl } from './db.js'
import { Therapist } from '../models/Therapist.js'
import { seedTherapists } from './seed.js'

const port = Number(process.env.PORT) || 3001

await connectDb()

// A database seeded before the referral feature has no therapists. Add the
// sample ones so referrals always have a contact to show.
if ((await Therapist.estimatedDocumentCount()) === 0) {
  const added = await seedTherapists()
  console.log(`[api] added ${added.length} sample therapists for referrals`)
}
const app = createApp({ mongoUrl: getMongoUrl() })

const server = app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`)
})

async function shutdown() {
  server.close()
  await app.locals.sessionStore.close()
  await disconnectDb()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
