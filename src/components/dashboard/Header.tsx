'use client'

import Badge from '@/components/ui/Badge'
import type { Profile } from '@/types'

interface HeaderProps {
  profile: Profile
  onMenuToggle?: () => void
}

export default function Header({ profile, onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 shrink-0 bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 sm:px-6 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="lg:hidden p-2.5 -ml-1 rounded-xl hover:bg-surface-dark transition-colors touch-manipulation"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-text truncate">
              Welcome back, {profile.full_name.split(' ')[0]}
            </h2>
            <p className="text-xs sm:text-sm text-text-light hidden sm:block truncate">
              {profile.role === 'teacher' ? 'Manage your subjects and student queries' : 'Ask AI about your courses'}
            </p>
          </div>
        </div>
        <Badge variant={profile.role === 'teacher' ? 'warning' : 'primary'} className="shrink-0 capitalize text-xs sm:text-sm">
          {profile.role}
        </Badge>
      </div>
    </header>
  )
}
