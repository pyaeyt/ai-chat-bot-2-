'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DirectMessage } from '@/types'

export function useRealtimeMessages(
  conversationId: string,
  initialMessages: DirectMessage[],
  currentUserId: string
) {
  const [messages, setMessages] = useState<DirectMessage[]>(initialMessages)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    const supabase = createClient()

    // Mark unread messages as read
    supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false)
      .then()

    // Subscribe to new messages
    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })

          // Mark as read if from other user
          if (newMsg.sender_id !== currentUserId) {
            supabase
              .from('direct_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id)
              .then()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  return messages
}
