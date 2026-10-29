import mongoose from 'mongoose'
import { pathToFileURL } from 'node:url'
import { User } from '../models/User.js'

export async function backfillEmailVerification() {
  const result = await User.collection.updateMany(
    { emailVerifiedAt: { $exists: false } },
    { $set: { emailVerifiedAt: new Date(), passwordChangedAt: null, authVersion: 0 } },
  )
  return result.modifiedCount
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    console.log('[migrate] MONGODB_URI is not set. Nothing to migrate.')
    process.exit(0)
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
  const count = await backfillEmailVerification()
  console.log(`[migrate] marked ${count} existing account(s) as email verified.`)
  await mongoose.disconnect()
}
