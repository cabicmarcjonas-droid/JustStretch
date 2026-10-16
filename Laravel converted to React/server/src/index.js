import { createApp } from './app.js'
import { connectDb, disconnectDb, getMongoUrl } from './db.js'

const port = Number(process.env.PORT) || 3001

await connectDb()
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
