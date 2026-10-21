import mongoose from 'mongoose'
import { BODY_AREA_VALUES } from '../shared/enums.js'
import { applyJsonTransform } from './toJSON.js'

// A physical therapist the app can refer members to. Therapists are not users:
// they never log in, the app only shows their contact details (paper, 3.2.1).
const therapistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    clinic: { type: String, required: true, trim: true, maxlength: 160 },
    // Body areas this therapist handles. Empty means a general practice that
    // takes any area; it is used when no specialist matches.
    areas: { type: [{ type: String, enum: BODY_AREA_VALUES }], default: [] },
    phone: { type: String, required: true, maxlength: 40 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 255 },
    address: { type: String, required: true, maxlength: 255 },
    // True for the seeded sample entries, so the UI can say they are not real.
    placeholder: { type: Boolean, default: false },
  },
  { timestamps: true },
)

applyJsonTransform(therapistSchema)

export const Therapist = mongoose.model('Therapist', therapistSchema)
