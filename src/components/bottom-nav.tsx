'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { BookOpen, BarChart2, User, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: BookOpen, match: ['/dashboard', '/subjects'] },
  { href: '/progress', label: 'Progress', icon: BarChart2, match: ['/progress'] },
  { href: '/profile', label: 'Profile', icon: User, match: ['/profile'] },
] as const

const HIDDEN_ROUTES = ['/', '/login', '/register', '/offline']

export default function BottomNav() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (HIDDEN_ROUTES.includes(pathname)) return null

  function isActive(match: readonly string[]) {
    return match.some((p) => pathname === p || pathname.startsWith(p + '/'))
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = isActive(match)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-[22px] w-[22px]', active && 'stroke-[2.5px]')}
              />
              <span className={cn('text-[11px] leading-none', active ? 'font-semibold' : 'font-medium')}>
                {label}
              </span>
            </Link>
          )
        })}

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === 'dark'
              ? <Sun className="h-[22px] w-[22px]" />
              : <Moon className="h-[22px] w-[22px]" />
          ) : (
            <Moon className="h-[22px] w-[22px]" />
          )}
          <span className="text-[11px] leading-none font-medium">Theme</span>
        </button>
      </div>
    </nav>
  )
}
