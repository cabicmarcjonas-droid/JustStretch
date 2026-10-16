// Shared toJSON transform: expose `id` as a string, hide Mongo internals.
export function applyJsonTransform(schema, hide = []) {
  schema.set('toJSON', {
    virtuals: false,
    versionKey: false,
    transform(_doc, ret) {
      ret.id = String(ret._id)
      delete ret._id
      for (const key of hide) delete ret[key]
      return ret
    },
  })
}
