import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

// Uses edge-safe authConfig — no Mongoose, no Node.js stream imports
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/subjects/:path*',
    '/progress/:path*',
  ],
}
