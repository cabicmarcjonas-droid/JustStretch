// Port of app/Enums/BodyArea.php and app/Enums/Difficulty.php.
// The client re-exports this file from src/lib/enums.js.

export const BODY_AREAS = [
  { value: 'neck', label: 'Neck', landmarks: [0, 7, 8, 11, 12] },
  { value: 'shoulders', label: 'Shoulders', landmarks: [11, 12, 13, 14] },
  { value: 'chest', label: 'Chest', landmarks: [11, 12, 13, 14, 15, 16] },
  { value: 'upper_back', label: 'Upper Back', landmarks: [11, 12, 13, 14, 23, 24] },
  { value: 'lower_back', label: 'Lower Back', landmarks: [11, 12, 23, 24, 25, 26] },
  { value: 'hips', label: 'Hips', landmarks: [23, 24, 25, 26] },
  { value: 'hamstrings', label: 'Hamstrings', landmarks: [23, 24, 25, 26, 27, 28] },
  { value: 'quads', label: 'Quads', landmarks: [23, 24, 25, 26, 27, 28] },
  { value: 'calves', label: 'Calves', landmarks: [25, 26, 27, 28, 29, 30, 31, 32] },
  { value: 'wrists', label: 'Wrists', landmarks: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22] },
]

export const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', badgeClasses: 'bg-accent-soft text-accent-dark border-accent/20' },
  { value: 'intermediate', label: 'Intermediate', badgeClasses: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'advanced', label: 'Advanced', badgeClasses: 'bg-rose-50 text-rose-800 border-rose-200' },
]

export const BODY_AREA_VALUES = BODY_AREAS.map((a) => a.value)
export const DIFFICULTY_VALUES = DIFFICULTIES.map((d) => d.value)

// The areas a member can pick on the body map, from the top of the body down.
// The labels come from BODY_AREAS, so they always match the ones on the exercises.
export const PAIN_AREAS = ['neck', 'shoulders', 'upper_back', 'lower_back', 'hips', 'quads', 'hamstrings']

export const bodyArea = (value) => BODY_AREAS.find((a) => a.value === value) ?? null
export const difficulty = (value) => DIFFICULTIES.find((d) => d.value === value) ?? null

export const areaLabel = (value) => bodyArea(value)?.label ?? value
export const areaLandmarks = (value) => bodyArea(value)?.landmarks ?? []
// Only the wrists area draws the finger skeleton in the accent colour.
export const highlightsHands = (value) => value === 'wrists'

export const difficultyLabel = (value) => difficulty(value)?.label ?? value
export const difficultyBadgeClasses = (value) => difficulty(value)?.badgeClasses ?? ''

// value => label maps, for select inputs (BodyArea::options(), Difficulty::options()).
export const areaOptions = () => Object.fromEntries(BODY_AREAS.map((a) => [a.value, a.label]))
export const difficultyOptions = () => Object.fromEntries(DIFFICULTIES.map((d) => [d.value, d.label]))

// ---- Model helpers (Exercise / StretchSession accessors) ----

// Newline-separated instructions as trimmed, non-empty steps.
export function instructionSteps(instructions) {
  return String(instructions ?? '')
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

// Whether the URL's path points straight at a file a <video> tag can play.
export function hasPlayableVideo(url) {
  if (!url) return false
  let path = String(url)
  try {
    path = new URL(path, 'http://placeholder.local').pathname
  } catch {
    // keep the raw string
  }
  return /\.(mp4|webm|ogg|mov)$/i.test(path)
}

// "4m 32s", "32s", or "—" when no duration was recorded.
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—'
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`
}
