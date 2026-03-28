import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/gemini'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId, message } = await request.json()

  // Fetch session to get subject_id
  const { data: session } = await supabase
    .from('ai_chat_sessions')
    .select('*, subjects(*, subject_info(*))')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Build subject context from teacher's data
  const subject = (session as any).subjects
  const infoEntries = subject?.subject_info || []
  let subjectContext = `Subject: ${subject?.name || 'Unknown'}\n`
  if (subject?.description) subjectContext += `Description: ${subject.description}\n`
  subjectContext += '---\n'

  if (infoEntries.length === 0) {
    subjectContext += 'No information has been provided by the teacher yet.\n'
  } else {
    for (const info of infoEntries) {
      subjectContext += `[${info.category.toUpperCase()}] ${info.title}: ${info.content}\n`
    }
  }

  // Fetch conversation history (last 20 messages)
  const { data: history } = await supabase
    .from('ai_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(20)

  const conversationHistory = (history || []).map((msg: any) => ({
    role: msg.role === 'user' ? 'user' as const : 'model' as const,
    content: msg.content,
  }))

  // Insert user message first
  await supabase.from('ai_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: message,
  })

  // Call Gemini
  try {
    const { text, needsTeacher } = await generateAIResponse(
      subjectContext,
      conversationHistory,
      message
    )

    // Insert AI response
    await supabase.from('ai_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: text,
      needs_teacher: needsTeacher,
    })

    // Update session title from first message
    if (!history || history.length === 0) {
      const title = message.length > 50 ? message.slice(0, 50) + '...' : message
      await supabase
        .from('ai_chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
    } else {
      await supabase
        .from('ai_chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)
    }

    return NextResponse.json({
      content: text,
      needsTeacher,
      teacherId: subject?.teacher_id,
      subjectId: subject?.id,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'AI service error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
