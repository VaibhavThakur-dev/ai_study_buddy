import mongoose, { Schema, type Document } from 'mongoose'

export interface IUserDocument extends Document {
  name: string
  email: string
  password?: string | null
  image?: string
  grade?: number | null
  isVerified: boolean
  createdAt: Date
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null },
    image: { type: String },
    grade: { type: Number, min: 3, max: 12, default: null },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// In development, delete cached model so schema changes apply after hot reload
if (process.env.NODE_ENV !== 'production') delete mongoose.models['User']
const User = mongoose.model<IUserDocument>('User', UserSchema)

export default User
