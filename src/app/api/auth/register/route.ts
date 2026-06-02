import { NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import OTP from '@/models/OTP'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, otp } = parsed.data

    await connectDB()

    // Check email not already taken
    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({ email })

    if (!otpDoc) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new code.' },
        { status: 400 }
      )
    }

    if (new Date() > otpDoc.expiresAt) {
      await OTP.deleteOne({ _id: otpDoc._id })
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new code.' },
        { status: 400 }
      )
    }

    if (otpDoc.code !== otp) {
      return NextResponse.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400 })
    }

    // OTP valid — delete it and create user
    await OTP.deleteOne({ _id: otpDoc._id })

    const hashed = await bcryptjs.hash(password, 12)
    await User.create({ name, email, password: hashed, isVerified: true })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Registration failed' },
      { status: 500 }
    )
  }
}
