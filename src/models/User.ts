import mongoose, { Schema, type Document } from 'mongoose'

export interface IUserDocument extends Document {
  name: string
  email: string
  password?: string | null
  image?: string
  grade?: number | null
  createdAt: Date
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null },
    image: { type: String },
    grade: { type: Number, min: 3, max: 12, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const User = mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema)

export default User
