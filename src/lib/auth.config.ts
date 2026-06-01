import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — NO Mongoose, NO bcrypt, NO Node.js-only imports
// Used by middleware (Edge Runtime)
// auth.ts extends this with DB-dependent providers
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' as const },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      return token
    },
  },
} satisfies NextAuthConfig
