'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import type { Subject, Profile } from '@/types'

export default function StudentDashboard() {
  const { profile } = useUser()
  const router = useRouter()
  const [subjects, setSubjects] = useState<(Subject & { teacher?: Profile })[]>([])
  const [subjectQuery, setSubjectQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase()
    if (!q) return subjects
    return subjects.filter((s) => {
      const name = s.name.toLowerCase()
      const desc = (s.description || '').toLowerCase()
      const teacher = (s.teacher?.full_name || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || teacher.includes(q)
    })
  }, [subjects, subjectQuery])

  useEffect(() => {
    if (!profile) return

    async function fetchData() {
      const supabase = createClient()

      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*, teacher:profiles!subjects_teacher_id_fkey(full_name, email)')
        .order('name')

      if (subjectsData) setSubjects(subjectsData as (Subject & { teacher?: Profile })[])
      setLoading(false)
    }

    fetchData()
  }, [profile])

  const startChat = async (subjectId: string) => {
    setCreating(subjectId)
    try {
      const res = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId }),
      })
      const data = await res.json()
      if (data.id) {
        router.push(`/student/chat/${data.id}`)
      }
    } catch {
      /* ignore */
    } finally {
      setCreating(null)
    }
  }

  if (loading) return <Spinner className="mt-12" />

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-text">Dashboard</h2>
        <p className="text-sm text-text-light mt-1">Choose a subject to start asking the AI assistant</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-text mb-1">Subjects</h3>
        <p className="text-sm text-text-light mb-4">Your enrolled topics and teachers</p>

        {subjects.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-text-light">No subjects available yet. Teachers need to add subjects first.</p>
          </Card>
        ) : (
          <>
            <div className="relative mb-4 w-full max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="search"
                value={subjectQuery}
                onChange={(e) => setSubjectQuery(e.target.value)}
                placeholder="Search by subject, description, or teacher…"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-text placeholder:text-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                aria-label="Search subjects"
              />
            </div>

            {filteredSubjects.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-text-light">No subjects match &ldquo;{subjectQuery.trim()}&rdquo;.</p>
                <button
                  type="button"
                  onClick={() => setSubjectQuery('')}
                  className="text-sm text-primary font-medium mt-2 hover:underline"
                >
                  Clear search
                </button>
              </Card>
            ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => (
              <Card key={subject.id} className="flex flex-col">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-text">{subject.name}</h4>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {subject.name.charAt(0)}
                    </div>
                  </div>
                  {subject.description && (
                    <p className="text-sm text-text-light mb-2 line-clamp-2">{subject.description}</p>
                  )}
                  <p className="text-xs text-text-light">
                    by {subject.teacher?.full_name || 'Unknown Teacher'}
                  </p>
                </div>
                <Button
                  onClick={() => startChat(subject.id)}
                  loading={creating === subject.id}
                  className="w-full mt-4"
                  size="sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Ask AI
                </Button>
              </Card>
            ))}
          </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
