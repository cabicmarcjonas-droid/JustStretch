import mongoose from 'mongoose'
import { applyJsonTransform } from './toJSON.js'

const userSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    userAgent: { type: String, maxlength: 500, default: '' },
    ip: { type: String, maxlength: 100, default: '' },
    lastSeenAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
)

applyJsonTransform(userSessionSchema, ['user', 'sessionId'])

export const UserSession = mongoose.model('UserSession', userSessionSchema)
