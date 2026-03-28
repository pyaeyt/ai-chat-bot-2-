'use client'

import Badge from '@/components/ui/Badge'
import type { Profile } from '@/types'

interface HeaderProps {
  profile: Profile
  onMenuToggle?: () => void
}

export default function Header({ profile, onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-xl hover:bg-surface-dark transition-colors"
            >
              <svg className="w-5 h-5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div>
            <h2 className="text-lg font-semibold text-text">
              Welcome back, {profile.full_name.split(' ')[0]}
            </h2>
            <p className="text-sm text-text-light">
              {profile.role === 'teacher' ? 'Manage your subjects and student queries' : 'Ask AI about your courses'}
            </p>
          </div>
        </div>
        <Badge variant={profile.role === 'teacher' ? 'warning' : 'primary'}>
          {profile.role}
        </Badge>
      </div>
    </header>
  )
}
