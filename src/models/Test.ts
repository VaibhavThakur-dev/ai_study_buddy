import mongoose, { Schema, type Document } from 'mongoose'

interface IMCQQuestion {
  question: string
  options: string[]
  correct: number
}

export interface ITestDocument extends Document {
  subjectId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  topic: string
  questions: IMCQQuestion[]
  userAnswers: number[]
  score: number
  timeTaken: number
  takenAt: Date
}

const MCQQuestionSchema = new Schema<IMCQQuestion>(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correct: { type: Number, required: true, min: 0, max: 3 },
  },
  { _id: false }
)

const TestSchema = new Schema<ITestDocument>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, trim: true },
    questions: { type: [MCQQuestionSchema], required: true },
    userAnswers: { type: [Number], default: [] },
    score: { type: Number, required: true, min: 0, max: 100 },
    timeTaken: { type: Number, required: true },
    takenAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

const Test = mongoose.models.Test ?? mongoose.model<ITestDocument>('Test', TestSchema)

export default Test
