import mongoose from 'mongoose'
import { applyJsonTransform } from './toJSON.js'

const stretchSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100, validate: Number.isInteger },
    durationSeconds: { type: Number, min: 0, max: 7200, default: null, validate: (v) => v === null || Number.isInteger(v) },
    notes: { type: String, maxlength: 500, default: null },
    completedAt: { type: Date, required: true },
  },
  { timestamps: true },
)

applyJsonTransform(stretchSessionSchema)

export const StretchSession = mongoose.model('StretchSession', stretchSessionSchema)
