'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Fetch profile to get role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      // Set role cookie for middleware
      document.cookie = `user_role=${profile?.role || 'student'}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

      router.push(profile?.role === 'teacher' ? '/teacher' : '/student')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-8 shadow-sm space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-text">Welcome back</h2>
        <p className="text-sm text-text-light mt-1">Sign in to your account</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

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
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button type="submit" loading={loading} className="w-full">
        Sign In
      </Button>

      <p className="text-center text-sm text-text-light">
        Don&apos;t have an account?{' '}
        <a href="/register" className="text-primary font-medium hover:text-primary-dark transition-colors">
          Sign up
        </a>
      </p>
    </form>
  )
}
