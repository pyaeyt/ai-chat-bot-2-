'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import ChatThreadShell from '@/components/dashboard/ChatThreadShell'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import type { DirectMessage, Conversation, Profile } from '@/types'

export default function StudentDMPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useUser()
  const conversationId = params.conversationId as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [initialMessages, setInitialMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const { data: conv } = await supabase
        .from('conversations')
        .select(`
          *,
          teacher:profiles!conversations_teacher_id_fkey(full_name, email),
          subject:subjects(name)
        `)
        .eq('id', conversationId)
        .single()

      if (conv) setConversation(conv as any)

      const { data: msgs } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgs) setInitialMessages(msgs as DirectMessage[])
      setLoading(false)
    }

    fetchData()
  }, [conversationId])

  const messages = useRealtimeMessages(
    conversationId,
    initialMessages,
    profile?.id || ''
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending || !profile) return

    const content = input.trim()
    setInput('')
    setSending(true)

    const supabase = createClient()
    await supabase.from('direct_messages').insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      content,
    })

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex flex-1 min-h-[50dvh] items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  const otherUser = (conversation as any)?.teacher

  return (
    <ChatThreadShell>
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-white shrink-0">
        <button
          type="button"
          onClick={() => router.push('/student/messages')}
          className="p-2 rounded-xl hover:bg-surface-dark transition-colors touch-manipulation shrink-0"
          aria-label="Back to messages"
        >
          <svg className="w-5 h-5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {otherUser?.full_name?.charAt(0)?.toUpperCase() || 'T'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text truncate">{otherUser?.full_name || 'Teacher'}</h3>
          {(conversation as any)?.subject?.name && (
            <Badge variant="primary" className="text-xs">{(conversation as any).subject.name}</Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-3 sm:py-4 space-y-3 bg-surface">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-light">Send a message to start the conversation</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === profile?.id
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[min(88%,20rem)] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 sm:px-4',
                isMe
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-white border border-border text-text rounded-bl-md shadow-sm'
              )}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={cn(
                  'text-xs mt-1',
                  isMe ? 'text-white/60' : 'text-text-light/60'
                )}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
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
            placeholder="Type a message..."
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
