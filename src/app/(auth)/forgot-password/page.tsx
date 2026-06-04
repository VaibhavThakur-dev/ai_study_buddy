'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Eye, EyeOff, BookOpen, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const emailSchema = z.object({
  email: z.string().email('Valid email required'),
})

const resetSchema = z
  .object({
    otp: z.string().length(6, 'Enter the 6-digit code'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type EmailForm = z.infer<typeof emailSchema>
type ResetForm = z.infer<typeof resetSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  function startCooldown() {
    setResendCooldown(60)
    const id = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(id)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function onEmailSubmit(data: EmailForm) {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      const json = (await res.json()) as { success?: boolean; error?: string; devOtp?: string }

      if (!res.ok) {
        toast.error(json.error ?? 'Failed to send code')
        return
      }

      setEmail(data.email)
      if (json.devOtp) setDevOtp(json.devOtp)
      setStep(2)
      startCooldown()
      toast.success('Reset code sent — check your email')
    } finally {
      setLoading(false)
    }
  }

  async function onResetSubmit(data: ResetForm) {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: data.otp, password: data.password }),
      })
      const json = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok) {
        toast.error(json.error ?? 'Failed to reset password')
        return
      }

      toast.success('Password reset! Please sign in.')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = (await res.json()) as { success?: boolean; error?: string; devOtp?: string }

      if (!res.ok) {
        toast.error(json.error ?? 'Failed to resend code')
        return
      }

      if (json.devOtp) setDevOtp(json.devOtp)
      startCooldown()
      toast.success('New code sent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Link
        href="/"
        className="flex items-center gap-2 font-bold text-lg mb-6 hover:opacity-80 transition-opacity"
      >
        <BookOpen className="h-5 w-5 text-primary" />
        AI Study Buddy
      </Link>

      <Card className="w-full max-w-md">
        {step === 1 ? (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Forgot password</CardTitle>
              <CardDescription>Enter your email to receive a reset code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...emailForm.register('email')}
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset code'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-foreground underline underline-offset-4"
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </p>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Reset password</CardTitle>
              <CardDescription>
                Code sent to{' '}
                <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {devOtp && (
                <div className="rounded-md bg-muted px-3 py-2 text-sm">
                  Dev OTP: <span className="font-mono font-bold">{devOtp}</span>
                </div>
              )}

              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="tracking-widest text-center text-lg font-mono"
                    {...resetForm.register('otp')}
                  />
                  {resetForm.formState.errors.otp && (
                    <p className="text-xs text-destructive">
                      {resetForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pr-10"
                      {...resetForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {resetForm.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {resetForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pr-10"
                      {...resetForm.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {resetForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset password'}
                </Button>
              </form>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft size={14} />
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
