import mongoose from 'mongoose'
import { applyJsonTransform } from './toJSON.js'

const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    usedAt: { type: Date, default: null },
    requestedIp: { type: String, maxlength: 100, default: '' },
  },
  { timestamps: true },
)

applyJsonTransform(passwordResetTokenSchema, ['user', 'tokenHash'])

export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema)
