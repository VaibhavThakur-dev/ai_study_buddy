import { NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import OTP from '@/models/OTP'
import { sendOTPEmail, generateOTP } from '@/lib/email'

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

    // Check if email is already registered
    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 })
    }

    // Rate limit — only 1 OTP per 60 seconds
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

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email })

    // Generate and save new OTP
    const code = generateOTP()
    await OTP.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    })

    // Send email
    await sendOTPEmail(email, code)

    const response: { success: boolean; devOtp?: string } = { success: true }
    if (process.env.NODE_ENV === 'development' && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
      response.devOtp = code
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[send-otp]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
