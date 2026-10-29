import mongoose from 'mongoose'
import { BODY_AREA_VALUES } from '../shared/enums.js'
import { applyJsonTransform } from './toJSON.js'

// One flexibility test: the measurement, its number and the unit it is in.
const measurementSchema = new mongoose.Schema(
  {
    test: { type: String, required: true, maxlength: 40 },
    value: { type: Number, required: true },
    unit: { type: String, required: true, maxlength: 20 },
  },
  { _id: false },
)

// The member's starting flexibility, measured once and kept as a reference.
const baselineSchema = new mongoose.Schema(
  {
    assessedAt: { type: Date, default: null },
    measurements: { type: [measurementSchema], default: [] },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    password: { type: String, required: true, select: false }, // bcrypt hash
    emailVerifiedAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    authVersion: { type: Number, default: 0, min: 0 },
    // Where the member hurts. Optional: members who never filled the body map
    // simply have none.
    painAreas: { type: [{ type: String, enum: BODY_AREA_VALUES }], default: [] },
    baseline: { type: baselineSchema, default: () => ({ assessedAt: null, measurements: [] }) },
  },
  { timestamps: true },
)

applyJsonTransform(userSchema, ['password', 'authVersion', 'passwordChangedAt'])

export const User = mongoose.model('User', userSchema)
