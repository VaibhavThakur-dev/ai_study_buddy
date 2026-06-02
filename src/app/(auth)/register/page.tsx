'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { BookOpen, Loader2, Mail, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/* ── Step 1 schema ── */
const formSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { status } = useSession()

  // Already logged in → go straight to dashboard
  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard')
  }, [status, router])

  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [pendingData, setPendingData] = useState<FormValues | null>(null)
  const [sendingOTP, setSendingOTP] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) })

  /* ── Step 1: Send OTP ── */
  async function onSubmitForm(data: FormValues) {
    setSendingOTP(true)
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email }),
    })
    const json = (await res.json()) as { error?: string; devOtp?: string }
    setSendingOTP(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Failed to send OTP')
      return
    }

    setPendingData(data)
    setStep('otp')
    startResendCooldown()

    if (json.devOtp) {
      toast.info(`[DEV] Your OTP is: ${json.devOtp}`, { duration: 30000 })
    } else {
      toast.success(`Verification code sent to ${data.email}`)
    }
  }

  /* ── Step 2: Verify OTP + Register ── */
  async function onVerifyOTP() {
    const otpCode = otp.join('')
    if (otpCode.length < 6) {
      toast.error('Please enter all 6 digits')
      return
    }
    if (!pendingData) return

    setVerifying(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: pendingData.name,
        email: pendingData.email,
        password: pendingData.password,
        otp: otpCode,
      }),
    })
    const json = (await res.json()) as { error?: string }
    setVerifying(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Verification failed')
      return
    }

    toast.success('Account created! Please sign in.')
    router.push('/login')
  }

  /* ── OTP digit input handlers ── */
  function handleOtpChange(idx: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const updated = [...otp]
    updated[idx] = digit
    setOtp(updated)
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!digits) return
    const updated = ['', '', '', '', '', '']
    digits.split('').forEach((d, i) => { updated[i] = d })
    setOtp(updated)
    const nextEmpty = Math.min(digits.length, 5)
    inputRefs.current[nextEmpty]?.focus()
  }

  /* ── Resend cooldown ── */
  function startResendCooldown() {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (!pendingData || resendCooldown > 0) return
    setSendingOTP(true)
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingData.email }),
    })
    const json = (await res.json()) as { error?: string; devOtp?: string }
    setSendingOTP(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Failed to resend OTP')
      return
    }

    setOtp(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
    startResendCooldown()

    if (json.devOtp) {
      toast.info(`[DEV] Your OTP is: ${json.devOtp}`, { duration: 30000 })
    } else {
      toast.success('New verification code sent!')
    }
  }

  /* ── Render ── */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-6 hover:opacity-80 transition-opacity">
        <BookOpen className="h-5 w-5 text-primary" />
        AI Study Buddy
      </Link>
      <Card className="w-full max-w-md">

        {step === 'form' ? (
          <>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Create account</CardTitle>
              </div>
              <CardDescription>Start your AI-powered study journey</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" placeholder="Your name" {...register('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      className="pr-10"
                      {...register('password')}
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
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pr-10"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={sendingOTP}>
                  {sendingOTP ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending code…</>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-foreground underline underline-offset-4">Sign in</Link>
              </p>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Verify your email</CardTitle>
              </div>
              <CardDescription>
                We sent a 6-digit code to{' '}
                <span className="font-medium text-foreground">{pendingData?.email}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* OTP digit boxes */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-14 text-center text-xl font-bold border-2 rounded-lg bg-background
                               focus:border-primary focus:outline-none transition-colors
                               border-border"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => void onVerifyOTP()}
                disabled={verifying || otp.join('').length < 6}
              >
                {verifying ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying…</>
                ) : (
                  'Verify & Create Account'
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setStep('form')}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Change email
                </button>

                <button
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                  onClick={() => void handleResend()}
                  disabled={resendCooldown > 0 || sendingOTP}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Code expires in 10 minutes. Check your spam folder if not received.
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
