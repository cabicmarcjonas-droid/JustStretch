import mongoose from 'mongoose'
import { applyJsonTransform } from './toJSON.js'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    password: { type: String, required: true }, // bcrypt hash
  },
  { timestamps: true },
)

applyJsonTransform(userSchema, ['password'])

export const User = mongoose.model('User', userSchema)
