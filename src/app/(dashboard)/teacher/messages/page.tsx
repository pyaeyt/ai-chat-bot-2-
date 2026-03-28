'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { formatRelativeTime, truncate } from '@/lib/utils'

export default function TeacherMessagesPage() {
  const { profile } = useUser()
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    async function fetchConversations() {
      const supabase = createClient()
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          student:profiles!conversations_student_id_fkey(full_name, email),
          subject:subjects(name)
        `)
        .eq('teacher_id', profile!.id)
        .order('updated_at', { ascending: false })

      if (data) {
        const withLastMsg = await Promise.all(
          data.map(async (conv: any) => {
            const { data: msgs } = await supabase
              .from('direct_messages')
              .select('content, created_at, sender_id')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)

            const { count: unreadCount } = await supabase
              .from('direct_messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('is_read', false)
              .neq('sender_id', profile!.id)

            return { ...conv, last_message: msgs?.[0] || null, unread_count: unreadCount || 0 }
          })
        )
        setConversations(withLastMsg)
      }
      setLoading(false)
    }

    fetchConversations()
  }, [profile])

  if (loading) return <Spinner className="mt-12" />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text">Student Messages</h2>
        <p className="text-sm text-text-light mt-1">Questions from students that the AI couldn&apos;t answer</p>
      </div>

      {conversations.length === 0 ? (
        <Card className="text-center py-12">
          <svg className="w-12 h-12 text-text-light/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-text-light font-medium">No messages yet</p>
          <p className="text-sm text-text-light/70 mt-1">Students will message you when the AI can&apos;t answer their questions</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv: any) => (
            <Card
              key={conv.id}
              hover
              onClick={() => router.push(`/teacher/messages/${conv.id}`)}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {conv.student?.full_name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-text truncate">{conv.student?.full_name || 'Student'}</h4>
                  {conv.subject?.name && <Badge variant="primary" className="text-xs">{conv.subject.name}</Badge>}
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                {conv.last_message && (
                  <p className="text-sm text-text-light truncate mt-0.5">
                    {conv.last_message.sender_id === profile?.id ? 'You: ' : ''}{truncate(conv.last_message.content, 60)}
                  </p>
                )}
              </div>
              {conv.last_message && (
                <p className="text-xs text-text-light flex-shrink-0">
                  {formatRelativeTime(conv.last_message.created_at)}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
