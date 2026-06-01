'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Save, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { IUserProfile } from '@/types'

const GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const GRADE_LABELS: Record<number, string> = {
  3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th',
  8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th',
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<IUserProfile | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile')
        const json = (await res.json()) as { success: boolean; data: IUserProfile }
        if (json.success) {
          setProfile(json.data)
          setSelectedGrade(json.data.grade ?? null)
        }
      } finally {
        setLoading(false)
      }
    }
    void fetchProfile()
  }, [])

  async function handleSave() {
    if (selectedGrade === profile?.grade) {
      toast.info('No changes to save')
      return
    }
    setSaving(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: selectedGrade }),
    })
    const json = (await res.json()) as { success: boolean; error?: string }
    if (json.success) {
      setProfile((p) => p ? { ...p, grade: selectedGrade } : p)
      toast.success('Profile updated!')
    } else {
      toast.error(json.error ?? 'Failed to save')
    }
    setSaving(false)
  }

  const initial = session?.user?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* ── User card ── */}
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={session?.user?.image ?? undefined} />
                  <AvatarFallback className="text-xl">{initial}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{session?.user?.name}</p>
                  <p className="text-muted-foreground text-sm">{session?.user?.email}</p>
                  {profile?.grade ? (
                    <Badge variant="secondary" className="mt-1.5">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Class {GRADE_LABELS[profile.grade]}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-1.5 text-muted-foreground">
                      Class not set
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Grade selector ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Your Class / Grade
                </CardTitle>
                <CardDescription>
                  Select your current class so AI can tailor lessons and questions to your level.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGrade(g)}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-semibold transition-all',
                        selectedGrade === g
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                          : 'bg-card border-border hover:bg-muted hover:border-primary/40'
                      )}
                    >
                      {GRADE_LABELS[g]}
                    </button>
                  ))}
                </div>

                {selectedGrade && (
                  <p className="text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">Class {GRADE_LABELS[selectedGrade]}</span>
                    {selectedGrade >= 11 && ' — AI will include board exam level content'}
                    {selectedGrade <= 5 && ' — AI will use simple language and basic concepts'}
                  </p>
                )}

                <Button
                  className="w-full"
                  onClick={() => void handleSave()}
                  disabled={saving || selectedGrade === profile?.grade}
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Save Profile</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
