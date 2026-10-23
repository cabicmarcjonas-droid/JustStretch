import mongoose from 'mongoose'
import { BODY_AREA_VALUES, DIFFICULTY_VALUES } from '../shared/enums.js'
import { applyJsonTransform } from './toJSON.js'

const exerciseSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    targetArea: { type: String, required: true, enum: BODY_AREA_VALUES, index: true },
    difficulty: { type: String, required: true, enum: DIFFICULTY_VALUES, index: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 30, validate: Number.isInteger },
    // Timed holds: the session is split evenly into sets × reps, so the last
    // rep of the last set ends exactly at durationMinutes. Defaults keep older
    // exercise documents valid (one set, one hold).
    sets: { type: Number, default: 1, min: 1, max: 20, validate: Number.isInteger },
    repsPerSet: { type: Number, default: 1, min: 1, max: 50, validate: Number.isInteger },
    description: { type: String, required: true, maxlength: 500 },
    instructions: { type: String, required: true, maxlength: 2000 }, // newline-separated steps
    benefits: {
      type: [{ type: String, maxlength: 80 }],
      validate: (v) => v.length >= 1 && v.length <= 5,
    },
    precautions: { type: String, maxlength: 300, default: null },
    videoUrl: { type: String, maxlength: 255, default: null },
  },
  { timestamps: true },
)

applyJsonTransform(exerciseSchema)

export const Exercise = mongoose.model('Exercise', exerciseSchema)
