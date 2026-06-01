import mongoose, { Schema, type Document } from 'mongoose'

export interface IOTPDocument extends Document {
  email: string
  code: string
  expiresAt: Date
  createdAt: Date
}

const OTPSchema = new Schema<IOTPDocument>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// TTL index — MongoDB auto-deletes expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
OTPSchema.index({ email: 1 })

const OTP = mongoose.models.OTP ?? mongoose.model<IOTPDocument>('OTP', OTPSchema)

export default OTP
