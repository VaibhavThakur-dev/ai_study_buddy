import { NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import OTP from '@/models/OTP'

const schema = z.object({
  email: z.string().email('Valid email required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { email, otp, password } = parsed.data

    await connectDB()

    const otpDoc = await OTP.findOne({ email })

    if (!otpDoc) {
      return NextResponse.json(
        { error: 'No reset code found. Please request a new code.' },
        { status: 400 }
      )
    }

    if (new Date() > otpDoc.expiresAt) {
      await OTP.deleteOne({ _id: otpDoc._id })
      return NextResponse.json(
        { error: 'Code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    if (otpDoc.code !== otp) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })
    }

    await OTP.deleteOne({ _id: otpDoc._id })

    const hashed = await bcryptjs.hash(password, 12)
    await User.updateOne({ email }, { $set: { password: hashed } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reset password' },
      { status: 500 }
    )
  }
}
