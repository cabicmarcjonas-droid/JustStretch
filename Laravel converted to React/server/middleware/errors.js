import mongoose from 'mongoose'

export const forbidden = (res) => res.status(403).json({ message: 'This action is unauthorized.' })
export const notFound = (res) => res.status(404).json({ message: 'Not found.' })

export const isValidId = (id) => mongoose.isValidObjectId(id) && String(new mongoose.Types.ObjectId(id)) === String(id)

export function apiNotFound(_req, res) {
  notFound(res)
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON.' })
  }
  console.error(err)
  res.status(500).json({ message: 'Something went wrong on the server.' })
}
