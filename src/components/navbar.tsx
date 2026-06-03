'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { BookOpen, BarChart2, LogOut, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function Navbar() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <nav className="border-b bg-card sticky top-0 z-40">
      <div className="container mx-auto px-4 h-14 lg:h-16 flex items-center justify-between max-w-6xl">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base lg:text-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>AI Study Buddy</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Progress — desktop only (bottom nav handles mobile/tablet) */}
          <Link href="/progress" className="hidden lg:block">
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />
              Progress
            </Button>
          </Link>

          {/* Theme toggle slider — desktop only */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
            className="hidden lg:flex items-center gap-1.5 px-1 py-1 rounded-full border border-border bg-muted transition-colors hover:bg-accent"
          >
            <Sun className="h-3.5 w-3.5 text-yellow-500 ml-1" />
            <div className="relative w-9 h-5 rounded-full bg-border transition-colors dark:bg-primary">
              <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 dark:translate-x-4" />
            </div>
            <Moon className="h-3.5 w-3.5 text-blue-400 mr-1" />
          </button>

          {/* Avatar → Profile — desktop only */}
          <Link href="/profile" className="hidden lg:block mx-2">
            <Avatar className="h-8 w-8 hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer">
              <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? 'User'} />
              <AvatarFallback className="text-xs">{initial}</AvatarFallback>
            </Avatar>
          </Link>

          {/* Sign out — always visible; icon only on mobile, icon+text on desktop */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline ml-1.5">Sign out</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be signed out of{' '}
                  <span className="font-medium text-foreground">AI Study Buddy</span>.
                  All your progress is saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </nav>
  )
}
