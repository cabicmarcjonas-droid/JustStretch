// Port of app/Http/Requests/*. Same rules, same messages.
import { z } from 'zod'
import { BODY_AREA_VALUES, DIFFICULTY_VALUES } from '../shared/enums.js'
import {
  emailField,
  enumField,
  intField,
  newPasswordField,
  required,
  stringField,
  withConfirmation,
} from './validate.js'

// "must be a full link or a path like /videos/stretch.mp4"
export const VIDEO_URL_MESSAGE = 'The video URL must be a full link or a path like /videos/stretch.mp4.'

function isFullUrl(value) {
  try {
    new URL(value)
    return /^[a-z][a-z0-9+.-]*:\/\/.+/i.test(value) || /^(mailto|tel):/i.test(value)
  } catch {
    return false
  }
}

const isLocalPath = (value) => /^\/[A-Za-z0-9_\-./]+$/.test(value)

// The form always posts five benefit inputs; drop the blank ones (trimmed already).
const benefitsField = z.preprocess(
  (v) => (Array.isArray(v) ? v.filter((b) => b !== null && b !== undefined && b !== '') : v),
  z
    .array(
      z.string({ error: 'The benefit field must be a string.' }).max(80, {
        error: 'The benefit field must not be greater than 80 characters.',
      }),
      { error: 'Add at least one benefit.' },
    )
    .min(1, { error: 'Add at least one benefit.' })
    .max(5, { error: 'The benefits field must not have more than 5 items.' }),
)

export const exerciseSchema = z.object({
  title: stringField('title', { max: 120 }),
  targetArea: enumField('target area', BODY_AREA_VALUES),
  difficulty: enumField('difficulty', DIFFICULTY_VALUES),
  durationMinutes: intField('duration', { min: 1, max: 30 }),
  sets: intField('sets', { min: 1, max: 20, optional: true }),
  repsPerSet: intField('reps per set', { min: 1, max: 50, optional: true }),
  description: stringField('description', { max: 500 }),
  instructions: stringField('instructions', { max: 2000 }),
  benefits: benefitsField,
  precautions: stringField('precautions', { max: 300, optional: true }),
  videoUrl: stringField('video URL', { max: 255, optional: true }).refine(
    (v) => v === null || v === undefined || isFullUrl(v) || isLocalPath(v),
    { error: VIDEO_URL_MESSAGE },
  ),
})

export const sessionSchema = z.object({
  score: intField('score', { min: 0, max: 100 }),
  durationSeconds: intField('duration seconds', { min: 0, max: 7200, optional: true }),
  notes: stringField('notes', { max: 500, optional: true }),
  clientId: stringField('client id', { max: 64, optional: true }),
})

// Editing a saved session (e.g. adding notes after an automatic save).
export const sessionUpdateSchema = z.object({
  score: intField('score', { min: 0, max: 100, optional: true }),
  notes: stringField('notes', { max: 500, optional: true }),
})

export const registerSchema = withConfirmation(
  z.object({
    name: stringField('name', { max: 255 }),
    email: emailField(),
    password: newPasswordField(),
    passwordConfirmation: z.string().nullish(),
  }),
)

export const loginSchema = z.object({
  email: emailField(),
  password: stringField('password'),
  remember: z.boolean().optional(),
})

export const profileSchema = z.object({
  name: stringField('name', { max: 255 }),
  email: emailField(),
})

export const passwordSchema = withConfirmation(
  z.object({
    currentPassword: stringField('current password'),
    password: newPasswordField(),
    passwordConfirmation: z.string().nullish(),
  }),
)

export const deleteAccountSchema = z.object({
  password: stringField('password'),
})

export { required }
