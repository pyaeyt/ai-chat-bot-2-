'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { formatRelativeTime, truncate } from '@/lib/utils'
import type { Subject, AiChatSession, Profile } from '@/types'

export default function StudentDashboard() {
  const { profile } = useUser()
  const router = useRouter()
  const [subjects, setSubjects] = useState<(Subject & { teacher?: Profile })[]>([])
  const [recentChats, setRecentChats] = useState<(AiChatSession & { subject?: Subject })[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return

    async function fetchData() {
      const supabase = createClient()

      // Fetch all subjects from all teachers
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*, teacher:profiles!subjects_teacher_id_fkey(full_name, email)')
        .order('name')

      if (subjectsData) setSubjects(subjectsData as any)

      // Fetch recent chat sessions
      const { data: chatsData } = await supabase
        .from('ai_chat_sessions')
        .select('*, subject:subjects(name)')
        .eq('student_id', profile!.id)
        .order('updated_at', { ascending: false })
        .limit(10)

      if (chatsData) setRecentChats(chatsData as any)
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
      setCreating(null)
    }
  }

  if (loading) return <Spinner className="mt-12" />

  return (
    <div className="space-y-8">
      {/* Subject Selection */}
      <div>
        <h3 className="text-lg font-semibold text-text mb-1">Choose a Subject</h3>
        <p className="text-sm text-text-light mb-4">Select a subject to start asking the AI assistant</p>

        {subjects.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-text-light">No subjects available yet. Teachers need to add subjects first.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
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
                    by {(subject as any).teacher?.full_name || 'Unknown Teacher'}
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
      </div>

      {/* Recent Chats */}
      {recentChats.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text mb-1">Recent Conversations</h3>
          <p className="text-sm text-text-light mb-4">Continue where you left off</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentChats.map((chat) => (
              <Card
                key={chat.id}
                hover
                onClick={() => router.push(`/student/chat/${chat.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text truncate">
                      {truncate(chat.title || 'New Chat', 40)}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="primary" className="text-xs">
                        {(chat as any).subject?.name || 'Unknown'}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-light mt-1.5">
                      {formatRelativeTime(chat.updated_at)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
