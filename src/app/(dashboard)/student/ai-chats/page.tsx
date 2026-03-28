'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { formatRelativeTime, truncate } from '@/lib/utils'
import type { AiChatSession, Subject } from '@/types'

type ChatRow = AiChatSession & {
  subject?: Pick<Subject, 'name'>
  last_message?: { role: string; content: string; created_at: string } | null
}

export default function StudentAiChatsPage() {
  const { profile } = useUser()
  const router = useRouter()
  const [chats, setChats] = useState<ChatRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return

    async function fetchChats() {
      const supabase = createClient()
      const { data } = await supabase
        .from('ai_chat_sessions')
        .select('*, subject:subjects(name)')
        .eq('student_id', profile!.id)
        .order('updated_at', { ascending: false })

      if (!data) {
        setLoading(false)
        return
      }

      const withLast = await Promise.all(
        data.map(async (chat: Record<string, unknown>) => {
          const { data: msgs } = await supabase
            .from('ai_messages')
            .select('role, content, created_at')
            .eq('session_id', chat.id as string)
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...chat,
            last_message: msgs?.[0] || null,
          } as ChatRow
        })
      )

      setChats(withLast)
      setLoading(false)
    }

    fetchChats()
  }, [profile])

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm('Delete this conversation? All messages will be removed.')) return
    setDeletingId(chatId)
    try {
      const res = await fetch(`/api/chat-sessions/${chatId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(typeof data.error === 'string' ? data.error : 'Delete failed')
        return
      }
      setChats((prev) => prev.filter((c) => c.id !== chatId))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <Spinner className="mt-12" />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text">AI chats</h2>
        <p className="text-sm text-text-light mt-1">Recent conversations with the subject assistant</p>
      </div>

      {chats.length === 0 ? (
        <Card className="text-center py-12">
          <svg
            className="w-12 h-12 text-text-light/40 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <p className="text-text-light font-medium">No AI chats yet</p>
          <p className="text-sm text-text-light/70 mt-1">
            From the dashboard, pick a subject and tap <span className="font-medium text-text">Ask AI</span> to start
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              hover
              onClick={() => router.push(`/student/chat/${chat.id}`)}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {(chat.subject?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-text truncate">{truncate(chat.title || 'New chat', 48)}</h4>
                  {chat.subject?.name && (
                    <Badge variant="primary" className="text-xs">
                      {chat.subject.name}
                    </Badge>
                  )}
                </div>
                {chat.last_message && (
                  <p className="text-sm text-text-light truncate mt-0.5">
                    {chat.last_message.role === 'user' ? 'You: ' : 'AI: '}
                    {truncate(chat.last_message.content, 72)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-xs text-text-light hidden sm:block">
                  {formatRelativeTime(chat.updated_at)}
                </p>
                <button
                  type="button"
                  title="Delete conversation"
                  disabled={deletingId === chat.id}
                  onClick={(e) => deleteChat(e, chat.id)}
                  className="p-2 rounded-xl text-text-light hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingId === chat.id ? (
                    <span className="block w-5 h-5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
