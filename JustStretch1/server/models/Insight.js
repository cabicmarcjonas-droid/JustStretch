import mongoose from 'mongoose'

// The dashboard's narrative recommendation, cached per member. It is only written
// again when the member's sessions change (`basedOn`), so Groq is called once per new
// session instead of on every dashboard visit.
const insightSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    basedOn: { type: String, required: true },
    narrative: { type: String, required: true, maxlength: 600 },
    source: { type: String, required: true, enum: ['groq', 'template'] },
    generatedAt: { type: Date, required: true },
  },
  { timestamps: true },
)

export const Insight = mongoose.model('Insight', insightSchema)
