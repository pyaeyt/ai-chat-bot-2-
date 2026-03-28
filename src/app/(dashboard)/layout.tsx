'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
import Spinner from '@/components/ui/Spinner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-light">Please log in to continue.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar profile={profile} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar profile={profile} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
