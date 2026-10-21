import mongoose from 'mongoose'
import { applyJsonTransform } from './toJSON.js'

// One row per tracked joint: how far off the reference the user was, and how
// often the joint stayed inside its margin of error.
const jointResultSchema = new mongoose.Schema(
  {
    joint: { type: String, required: true, maxlength: 40 },
    avgError: { type: Number, required: true, min: 0, max: 180 },
    timeInRangePct: { type: Number, required: true, min: 0, max: 100, validate: Number.isInteger },
  },
  { _id: false },
)

const stretchSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100, validate: Number.isInteger },
    durationSeconds: { type: Number, min: 0, max: 7200, default: null, validate: (v) => v === null || Number.isInteger(v) },
    notes: { type: String, maxlength: 500, default: null },
    // Tracking results from the camera. Null for self-rated sessions and for
    // sessions saved before these fields existed.
    jointResults: { type: [jointResultSchema], default: [] },
    judgedFrames: { type: Number, min: 0, default: null },
    framesWithinMargin: { type: Number, min: 0, default: null },
    trackingScore: { type: Number, min: 0, max: 100, default: null, validate: (v) => v === null || Number.isInteger(v) },
    droppedFrames: { type: Number, min: 0, default: null },
    fatigue: { type: Number, min: 1, max: 5, default: null, validate: (v) => v === null || Number.isInteger(v) },
    completedAt: { type: Date, required: true },
  },
  { timestamps: true },
)

applyJsonTransform(stretchSessionSchema)

export const StretchSession = mongoose.model('StretchSession', stretchSessionSchema)
