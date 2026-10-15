// Laravel does this with cascadeOnDelete(); Mongo has no foreign keys, so the
// routes call these helpers instead of deleting documents directly.
import { Exercise } from './Exercise.js'
import { StretchSession } from './StretchSession.js'
import { User } from './User.js'

export async function deleteExercise(exerciseId) {
  await StretchSession.deleteMany({ exercise: exerciseId })
  await Exercise.deleteOne({ _id: exerciseId })
}

export async function deleteUser(userId) {
  const exercises = await Exercise.find({ author: userId }).select('_id')
  const exerciseIds = exercises.map((e) => e._id)

  // Sessions of other users on this user's exercises go with those exercises.
  await StretchSession.deleteMany({ $or: [{ user: userId }, { exercise: { $in: exerciseIds } }] })
  await Exercise.deleteMany({ author: userId })
  await User.deleteOne({ _id: userId })
}
