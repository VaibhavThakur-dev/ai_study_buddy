'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { BookOpen, BarChart2, LogOut } from 'lucide-react'
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
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="h-5 w-5" />
          AI Study Buddy
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/progress">
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />
              Progress
            </Button>
          </Link>

          {/* Avatar → Profile page */}
          <Link href="/profile" className="mx-2">
            <Avatar className="h-8 w-8 hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer">
              <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? 'User'} />
              <AvatarFallback className="text-xs">{initial}</AvatarFallback>
            </Avatar>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Sign out</span>
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
