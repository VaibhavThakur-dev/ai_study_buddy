import { NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import OTP from '@/models/OTP'
import { sendPasswordResetEmail, generateOTP } from '@/lib/email'

const schema = z.object({
  email: z.string().email('Valid email required'),
})

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { email } = parsed.data

    await connectDB()

    const user = await User.findOne({ email })

    // Return success even when email not found to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'This account uses Google sign-in. Please sign in with Google.' },
        { status: 400 }
      )
    }

    // Rate limit — 1 OTP per 60 seconds
    const recentOTP = await OTP.findOne({
      email,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    })
    if (recentOTP) {
      return NextResponse.json(
        { error: 'Please wait 60 seconds before requesting a new code' },
        { status: 429 }
      )
    }

    await OTP.deleteMany({ email })

    const code = generateOTP()
    await OTP.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    await sendPasswordResetEmail(email, code)

    const response: { success: boolean; devOtp?: string } = { success: true }
    if (process.env.NODE_ENV === 'development' && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
      response.devOtp = code
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send reset code' },
      { status: 500 }
    )
  }
}
