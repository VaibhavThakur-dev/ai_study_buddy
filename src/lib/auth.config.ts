import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — NO Mongoose, NO bcrypt, NO Node.js-only imports
// Used by middleware (Edge Runtime)
// auth.ts extends this with DB-dependent providers
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' as const, maxAge: 15 * 24 * 60 * 60 }, // 15 days
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      if (session.user && token.name) {
        session.user.name = token.name as string
      }
      return session
    },
    async jwt({ token, user, trigger, session: updatedData }) {
      if (user?.id) token.sub = user.id
      if (user?.name) token.name = user.name
      // Handle profile update — refresh name in token
      if (trigger === 'update' && (updatedData as { name?: string })?.name) {
        token.name = (updatedData as { name: string }).name
      }
      return token
    },
  },
} satisfies NextAuthConfig
