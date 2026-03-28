'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { mapSupabaseAuthError } from '@/lib/authErrors'

export default function RegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    const supabase = createClient()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    if (authError) {
      setError(mapSupabaseAuthError(authError.message))
      setLoading(false)
      return
    }

    if (data.session && data.user) {
      document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      router.push(role === 'teacher' ? '/teacher' : '/student')
      router.refresh()
      return
    }

    if (data.user && !data.session) {
      setInfo(
        'Check your email and confirm your account, then sign in here. ' +
          'For local testing without email, turn off “Confirm email” in Supabase → Authentication → Providers → Email.'
      )
      setLoading(false)
      return
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-8 shadow-sm space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-text">Create account</h2>
        <p className="text-sm text-text-light mt-1">Join EduChat today</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {info && (
        <div className="bg-emerald-50 text-emerald-800 text-sm p-3 rounded-xl border border-emerald-100">
          {info}
        </div>
      )}

      {/* Role Selection */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-text">I am a</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
              role === 'student'
                ? 'border-primary bg-indigo-50 text-primary'
                : 'border-border hover:border-primary/30 text-text-light'
            )}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm font-medium">Student</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
              role === 'teacher'
                ? 'border-primary bg-indigo-50 text-primary'
                : 'border-border hover:border-primary/30 text-text-light'
            )}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-sm font-medium">Teacher</span>
          </button>
        </div>
      </div>

      <Input
        id="fullName"
        label="Full Name"
        type="text"
        placeholder="Your full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />

      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="At least 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />

      <Button type="submit" loading={loading} className="w-full">
        Create Account
      </Button>

      <p className="text-center text-sm text-text-light">
        Already have an account?{' '}
        <a href="/login" className="text-primary font-medium hover:text-primary-dark transition-colors">
          Sign in
        </a>
      </p>
    </form>
  )
}
