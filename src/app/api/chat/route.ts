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

  if (!sessionId || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'sessionId and message are required' }, { status: 400 })
  }

  const { data: session, error: sessionError } = await supabase
    .from('ai_chat_sessions')
    .select('*, subjects(*, subject_info(*))')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: sessionError?.message || 'Session not found' },
      { status: 404 }
    )
  }

  const rawSubject = (session as { subjects?: Record<string, unknown> | Record<string, unknown>[] | null })
    .subjects
  const subject = Array.isArray(rawSubject) ? rawSubject[0] : rawSubject
  let infoEntries = (subject?.subject_info as Record<string, unknown>[] | undefined) || []

  if (subject?.id && (!Array.isArray(infoEntries) || infoEntries.length === 0)) {
    const { data: rows } = await supabase
      .from('subject_info')
      .select('category, title, content')
      .eq('subject_id', subject.id as string)
      .order('created_at', { ascending: true })
    if (rows?.length) infoEntries = rows
  }
  let subjectContext = `Subject: ${subject?.name || 'Unknown'}\n`
  if (subject?.description) subjectContext += `Description: ${subject.description}\n`
  subjectContext += '---\n'

  if (infoEntries.length === 0) {
    subjectContext += 'No information has been provided by the teacher yet.\n'
  } else {
    for (const info of infoEntries) {
      const cat = String((info as { category?: string }).category || 'general').toUpperCase()
      const title = String((info as { title?: string }).title || '')
      const content = String((info as { content?: string }).content || '')
      subjectContext += `[${cat}] ${title}: ${content}\n`
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

  const { error: userInsertError } = await supabase.from('ai_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: message,
  })

  if (userInsertError) {
    return NextResponse.json(
      { error: 'Could not save your message: ' + userInsertError.message },
      { status: 400 }
    )
  }

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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'AI service error: ' + msg }, { status: 500 })
  }
}
