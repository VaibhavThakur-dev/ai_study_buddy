import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    const user = await User.findById(session.user.id).lean()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        image: user.image,
        grade: user.grade ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

const patchSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  grade: z.number().int().min(3).max(12).nullable().optional(),
})

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as unknown
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    await connectDB()
    const updated = await User.findByIdAndUpdate(
      session.user.id,
      { $set: parsed.data },
      { new: true }
    ).lean()

    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      data: { name: updated.name, email: updated.email, grade: updated.grade ?? null },
    })
  } catch (err) {
    console.error('[user/profile PATCH]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to update profile' }, { status: 500 })
  }
}
