import Link from 'next/link'
import { BookOpen, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center max-w-6xl">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="h-5 w-5" />
            AI Study Buddy
          </Link>
        </div>
      </nav>

      {/* 404 Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Big 404 */}
          <div className="relative mb-8">
            <p className="text-[9rem] font-bold leading-none text-muted/30 select-none">
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Search className="h-9 w-9 text-primary" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-3">Page not found</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Looks like this page went on a study break and never came back.
            Let&apos;s get you back on track.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/dashboard">
              <Button className="gap-2">
                <BookOpen className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-5 px-4 text-center text-sm text-muted-foreground">
        © 2025 AI Study Buddy — Free forever
      </footer>
    </div>
  )
}
