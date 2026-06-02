'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Save, GraduationCap, User, Calendar } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/store/profile-store'

const GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const GRADE_LABELS: Record<number, string> = {
  3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th',
  8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th',
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const { profile, loading, fetch: fetchProfile, update: updateProfile } = useProfileStore()

  const [name, setName] = useState('')
  const [age, setAge] = useState<string>('')
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  // Sync local form state when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setAge(profile.age ? String(profile.age) : '')
      setSelectedGrade(profile.grade ?? null)
    }
  }, [profile])

  async function handleSave() {
    const ageNum = age.trim() ? parseInt(age) : null
    if (ageNum !== null && (isNaN(ageNum) || ageNum < 5 || ageNum > 30)) {
      toast.error('Age must be between 5 and 30')
      return
    }
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }

    const unchanged =
      name.trim() === profile?.name &&
      ageNum === (profile?.age ?? null) &&
      selectedGrade === (profile?.grade ?? null)

    if (unchanged) { toast.info('No changes to save'); return }

    setSaving(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), age: ageNum, grade: selectedGrade }),
    })
    const json = (await res.json()) as { success: boolean; error?: string }
    if (json.success) {
      updateProfile({ name: name.trim(), age: ageNum, grade: selectedGrade })
      await updateSession({ name: name.trim() })
      toast.success('Profile updated!')
    } else {
      toast.error(json.error ?? 'Failed to save')
    }
    setSaving(false)
  }

  const displayName = name || session?.user?.name || '?'
  const initial = displayName[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        {loading && !profile ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
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
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{profile?.name || session?.user?.name}</p>
                  <p className="text-muted-foreground text-sm">{session?.user?.email}</p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {profile?.age && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />Age {profile.age}
                      </Badge>
                    )}
                    {profile?.grade ? (
                      <Badge variant="secondary" className="text-xs">
                        <GraduationCap className="h-3 w-3 mr-1" />Class {GRADE_LABELS[profile.grade]}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Class not set</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Edit form ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />Edit Profile
                </CardTitle>
                <CardDescription>Update your personal details and class.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name" maxLength={60} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" min={5} max={30} value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Your age" className="w-32" />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />Class / Grade
                  </Label>
                  <div className="grid grid-cols-5 gap-2">
                    {GRADES.map((g) => (
                      <button key={g} onClick={() => setSelectedGrade(g)}
                        className={cn(
                          'py-2.5 rounded-xl border text-sm font-semibold transition-all',
                          selectedGrade === g
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                            : 'bg-card border-border hover:bg-muted hover:border-primary/40'
                        )}>
                        {GRADE_LABELS[g]}
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={() => void handleSave()} disabled={saving}>
                  {saving
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                    : <><Save className="h-4 w-4 mr-2" />Save Profile</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
