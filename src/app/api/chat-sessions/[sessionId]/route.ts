import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const POLICY_HINT =
  'Run the SQL file supabase/migrations/002_ai_chat_sessions_student_delete.sql in the Supabase SQL Editor (policy "Students can delete own sessions").'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('student_id', user.id)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data?.length) {
    return NextResponse.json(
      {
        error: `Could not delete this chat (nothing removed). ${POLICY_HINT}`,
      },
      { status: 403 }
    )
  }

  return NextResponse.json({ ok: true })
}
