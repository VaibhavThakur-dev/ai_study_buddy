import mongoose, { Schema, type Document } from 'mongoose'

export interface IUserDocument extends Document {
  name: string
  email: string
  password?: string | null
  image?: string
  grade?: number | null
  age?: number | null
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
    age: { type: Number, min: 5, max: 30, default: null },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Dev: clear cached model so schema changes apply after hot reload
// Prod: reuse existing model to avoid OverwriteModelError
if (process.env.NODE_ENV !== 'production') delete mongoose.models['User']
const User = (mongoose.models.User as mongoose.Model<IUserDocument>) ?? mongoose.model<IUserDocument>('User', UserSchema)

export default User
