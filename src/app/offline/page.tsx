'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
      <div className="text-6xl mb-6">📚</div>
      <h1 className="text-2xl font-bold text-foreground mb-3">
        You are offline
      </h1>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        Internet nahi hai. Previously loaded subjects aur lessons access kar sakte ho.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold"
      >
        Try Again
      </button>
    </div>
  )
}
