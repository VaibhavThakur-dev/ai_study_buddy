import Navbar from '@/components/navbar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col pb-nav lg:pb-0">
        {children}
      </main>
    </div>
  )
}
