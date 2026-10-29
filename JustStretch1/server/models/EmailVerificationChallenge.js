import mongoose from 'mongoose'
import { applyJsonTransform } from './toJSON.js'

const emailVerificationChallengeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pendingId: { type: String, required: true, index: true },
    challengeId: { type: String, required: true, unique: true, index: true },
    codeHash: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    source: { type: String, enum: ['register', 'login'], required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5, min: 1 },
    sendCount: { type: Number, default: 1, min: 1 },
    lastSentAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    requestedIp: { type: String, maxlength: 100, default: '' },
  },
  { timestamps: true },
)

applyJsonTransform(emailVerificationChallengeSchema, ['user', 'codeHash'])

export const EmailVerificationChallenge = mongoose.model('EmailVerificationChallenge', emailVerificationChallengeSchema)
