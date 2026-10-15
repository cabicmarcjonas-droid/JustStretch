import mongoose from 'mongoose'

let memoryServer = null
let mongoUrl = null

export const getMongoUrl = () => mongoUrl

const isProduction = () => process.env.NODE_ENV === 'production'

// Connects to MONGODB_URI. In development, if the URI is missing or the
// connection fails, falls back to an in-memory MongoDB and seeds it so the
// demo still works on a laptop without MongoDB installed.
// Returns { inMemory } so the caller knows whether the data is throwaway.
export async function connectDb() {
  const uri = process.env.MONGODB_URI?.trim()

  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
      mongoUrl = uri
      console.log(`[db] connected to ${uri.replace(/\/\/[^@]*@/, '//***@')}`)
      return { inMemory: false }
    } catch (error) {
      if (isProduction()) throw error
      console.warn(`[db] WARNING: could not connect to MONGODB_URI (${error.message}).`)
    }
  } else if (isProduction()) {
    throw new Error('MONGODB_URI is required in production.')
  } else {
    console.warn('[db] WARNING: MONGODB_URI is not set.')
  }

  console.warn('[db] WARNING: starting an in-memory MongoDB. Data is reseeded on every start and lost on exit.')
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  memoryServer = await MongoMemoryServer.create()
  mongoUrl = memoryServer.getUri('juststretch')
  await mongoose.connect(mongoUrl)

  const { seedDatabase } = await import('./seed.js')
  await seedDatabase()
  return { inMemory: true }
}

export async function disconnectDb() {
  await mongoose.disconnect()
  await memoryServer?.stop()
  memoryServer = null
}
