-- Allow students to delete their own AI chat sessions (messages cascade).
-- Safe to run more than once in the Supabase SQL Editor.

DROP POLICY IF EXISTS "Students can delete own sessions" ON public.ai_chat_sessions;

CREATE POLICY "Students can delete own sessions"
  ON public.ai_chat_sessions
  FOR DELETE
  USING (auth.uid() = student_id);
