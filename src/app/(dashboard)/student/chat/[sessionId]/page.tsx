'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import ChatThreadShell from '@/components/dashboard/ChatThreadShell'
import { cn } from '@/lib/utils'
import type { AiMessage, Subject } from '@/types'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useUser()
  const sessionId = params.sessionId as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<AiMessage[]>([])
  const [subject, setSubject] = useState<Subject | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchSession() {
      const supabase = createClient()
      const { data: session } = await supabase
        .from('ai_chat_sessions')
        .select('*, subjects(*)')
        .eq('id', sessionId)
        .single()

      if (session) {
        setSubject((session as any).subjects as Subject)
      }

      const { data: msgs } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (msgs) setMessages(msgs as AiMessage[])
      setLoading(false)
    }

    fetchSession()
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setSending(true)

    // Optimistically add user message
    const tempUserMsg: AiMessage = {
      id: 'temp-user-' + Date.now(),
      session_id: sessionId,
      role: 'user',
      content: userMessage,
      needs_teacher: false,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ sessionId, message: userMessage }),
      })

      const data = await res.json()

      if (data.error) {
        const detail =
          typeof data.error === 'string'
            ? data.error
            : 'Sorry, something went wrong. Please try again.'
        const errorMsg: AiMessage = {
          id: 'temp-error-' + Date.now(),
          session_id: sessionId,
          role: 'assistant',
          content:
            detail.length > 320 ? detail.slice(0, 317) + '…' : detail,
          needs_teacher: false,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMsg])
      } else {
        const aiMsg: AiMessage = {
          id: 'temp-ai-' + Date.now(),
          session_id: sessionId,
          role: 'assistant',
          content: data.content,
          needs_teacher: data.needsTeacher,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiMsg])
      }
    } catch {
      const errorMsg: AiMessage = {
        id: 'temp-error-' + Date.now(),
        session_id: sessionId,
        role: 'assistant',
        content: 'Network error. Please check your connection.',
        needs_teacher: false,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    }

    setSending(false)
  }

  const deleteConversation = async () => {
    if (!confirm('Delete this conversation? All messages will be removed.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/chat-sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(typeof data.error === 'string' ? data.error : 'Delete failed')
        return
      }
      router.push('/student/ai-chats')
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  const handleChatWithTeacher = async (teacherId: string, subjectId: string) => {
    if (!profile) return
    const supabase = createClient()

    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('student_id', profile.id)
      .eq('teacher_id', teacherId)
      .eq('subject_id', subjectId)
      .single()

    if (existing) {
      router.push(`/student/messages/${existing.id}`)
      return
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        student_id: profile.id,
        teacher_id: teacherId,
        subject_id: subjectId,
      })
      .select()
      .single()

    if (newConv) {
      router.push(`/student/messages/${newConv.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 min-h-[50dvh] items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <ChatThreadShell>
      {/* Chat Header */}
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-white shrink-0">
        <button
          type="button"
          onClick={() => router.push('/student/ai-chats')}
          className="p-2 rounded-xl hover:bg-surface-dark transition-colors touch-manipulation shrink-0"
          aria-label="Back to AI chats"
        >
          <svg className="w-5 h-5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text truncate">AI Chat</h3>
          {subject && <Badge variant="primary" className="mt-0.5">{subject.name}</Badge>}
        </div>
        <button
          type="button"
          title="Delete conversation"
          disabled={deleting}
          onClick={deleteConversation}
          className="p-2 rounded-xl text-text-light hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0 touch-manipulation"
        >
          {deleting ? (
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

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-3 sm:py-4 space-y-4 bg-surface">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-text">Ask me anything about {subject?.name || 'this subject'}!</h3>
            <p className="text-sm text-text-light mt-1">
              Use any language you prefer—the assistant will reply in the same language, using only your teacher&apos;s materials.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in-up">
            <div className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[min(92%,36rem)] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-white border border-border text-text rounded-bl-md shadow-sm'
              )}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed" dir="auto">
                  {msg.content}
                </p>
              </div>
            </div>
            {/* Chat with Teacher button */}
            {msg.needs_teacher && subject && (
              <div className="flex justify-start mt-2 ml-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleChatWithTeacher(subject.teacher_id, subject.id)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat with Teacher
                </Button>
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-text-light/40 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-text-light/40 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-text-light/40 rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-white shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex gap-2 sm:gap-3 max-w-4xl mx-auto w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask in any language…"
            className="flex-1 min-w-0 px-3.5 py-3 sm:px-4 text-base sm:text-sm rounded-xl border border-border bg-surface text-text placeholder:text-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            disabled={sending}
            enterKeyHint="send"
          />
          <Button type="submit" disabled={!input.trim() || sending} className="px-4 sm:px-5 shrink-0 touch-manipulation">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </form>
    </ChatThreadShell>
  )
}
