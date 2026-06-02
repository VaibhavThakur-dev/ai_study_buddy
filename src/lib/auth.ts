import NextAuth from 'next-auth'
import type { DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcryptjs from 'bcryptjs'
import { authConfig } from './auth.config'
import connectDB from './mongodb'
import User from '@/models/User'

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
  }
}

// Full auth config — runs only in Node.js runtime (API routes, server components)
// Middleware uses auth.config.ts directly to avoid Edge Runtime issues
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectDB()
        const email = (credentials.email as string).toLowerCase().trim()
        const user = await User.findOne({ email }).lean()
        if (!user || !user.password) return null

        const isValid = await bcryptjs.compare(
          credentials.password as string,
          user.password
        )
        if (!isValid) return null

        if (user.isVerified === false) return null

        return {
          id: (user._id as { toString(): string }).toString(),
          email: user.email,
          name: user.name,
          image: user.image ?? null,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connectDB()
        const existing = await User.findOne({ email: user.email })
        if (!existing) {
          await User.create({ name: user.name ?? '', email: user.email ?? '', image: user.image ?? undefined, isVerified: true })
        }
      }
      return true
    },
  },
})
