'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        {children}
        <Toaster richColors position="top-right" />
      </SessionProvider>
    </ThemeProvider>
  )
}
