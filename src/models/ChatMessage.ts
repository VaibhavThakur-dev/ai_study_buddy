import mongoose, { Schema, type Document } from 'mongoose'

export interface IChatMessageDocument extends Document {
  subjectId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  topic: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

const ChatMessageSchema = new Schema<IChatMessageDocument>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

if (process.env.NODE_ENV !== 'production') delete mongoose.models['ChatMessage']
const ChatMessage = mongoose.model<IChatMessageDocument>('ChatMessage', ChatMessageSchema)

export default ChatMessage
