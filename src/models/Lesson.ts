import mongoose, { Schema, type Document } from 'mongoose'

interface IFlashcard {
  question: string
  answer: string
}

export interface ILessonDocument extends Document {
  subjectId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  topic: string
  content: string
  flashcards: IFlashcard[]
  createdAt: Date
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
)

const LessonSchema = new Schema<ILessonDocument>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    flashcards: { type: [FlashcardSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

if (process.env.NODE_ENV !== 'production') delete mongoose.models['Lesson']
const Lesson = mongoose.model<ILessonDocument>('Lesson', LessonSchema)

export default Lesson
