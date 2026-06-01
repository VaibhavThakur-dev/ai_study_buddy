import mongoose, { Schema, type Document } from 'mongoose'

export interface ISubjectDocument extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  syllabus: string
  topics: string[]
  createdAt: Date
}

const SubjectSchema = new Schema<ISubjectDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    syllabus: { type: String, required: true },
    topics: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const Subject =
  mongoose.models.Subject ?? mongoose.model<ISubjectDocument>('Subject', SubjectSchema)

export default Subject
