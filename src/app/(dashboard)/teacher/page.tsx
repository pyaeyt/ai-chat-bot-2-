'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'

export default function TeacherDashboard() {
  const { profile } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState({ subjects: 0, infoEntries: 0, unreadMessages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const supabase = createClient()

    async function fetchStats() {
      const { count: subjectCount } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', profile!.id)

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id')
        .eq('teacher_id', profile!.id)

      let infoCount = 0
      if (subjects && subjects.length > 0) {
        const { count } = await supabase
          .from('subject_info')
          .select('*', { count: 'exact', head: true })
          .in('subject_id', subjects.map(s => s.id))
        infoCount = count || 0
      }

      const { count: unreadCount } = await supabase
        .from('direct_messages')
        .select('*, conversations!inner(teacher_id)', { count: 'exact', head: true })
        .eq('conversations.teacher_id', profile!.id)
        .eq('is_read', false)
        .neq('sender_id', profile!.id)

      setStats({
        subjects: subjectCount || 0,
        infoEntries: infoCount,
        unreadMessages: unreadCount || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [profile])

  if (loading) return <Spinner className="mt-12" />

  const cards = [
    {
      title: 'Subjects',
      value: stats.subjects,
      description: 'Courses you teach',
      color: 'from-indigo-500 to-indigo-600',
      href: '/teacher/subjects',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      title: 'Info Entries',
      value: stats.infoEntries,
      description: 'Data available for AI',
      color: 'from-cyan-500 to-cyan-600',
      href: '/teacher/subjects',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      description: 'Student queries waiting',
      color: 'from-amber-500 to-amber-600',
      href: '/teacher/messages',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            hover
            onClick={() => router.push(card.href)}
            className="relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text-light">{card.title}</p>
                <p className="text-3xl font-bold text-text mt-1">{card.value}</p>
                <p className="text-xs text-text-light mt-1">{card.description}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-sm`}>
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-text mb-2">Quick Start Guide</h3>
        <div className="space-y-3 text-sm text-text-light">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <p>Go to <strong className="text-text">Subjects</strong> and add the courses you teach.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <p>Add information like exam dates, room numbers, and schedules to each subject.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <p>Students can then ask the AI about your subjects, and it will answer from your data.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
            <p>If the AI can&apos;t answer, students can message you directly through <strong className="text-text">Messages</strong>.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
