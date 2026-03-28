-- ============================================
-- AI Educational Chatbot - Database Schema
-- ============================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(teacher_id, name)
);

-- 3. Subject info table (teacher-provided data for AI)
CREATE TABLE public.subject_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('exam', 'room', 'schedule', 'announcement', 'general')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. AI chat sessions
CREATE TABLE public.ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. AI messages
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  needs_teacher BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Conversations (direct message threads)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_id, teacher_id, subject_id)
);

-- 7. Direct messages
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_subjects_teacher ON public.subjects(teacher_id);
CREATE INDEX idx_subject_info_subject ON public.subject_info(subject_id);
CREATE INDEX idx_ai_sessions_student ON public.ai_chat_sessions(student_id);
CREATE INDEX idx_ai_sessions_subject ON public.ai_chat_sessions(subject_id);
CREATE INDEX idx_ai_messages_session ON public.ai_messages(session_id);
CREATE INDEX idx_conversations_student ON public.conversations(student_id);
CREATE INDEX idx_conversations_teacher ON public.conversations(teacher_id);
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(conversation_id);

-- ============================================
-- Trigger: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Row Level Security
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Teachers can insert own subjects" ON public.subjects FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update own subjects" ON public.subjects FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete own subjects" ON public.subjects FOR DELETE USING (auth.uid() = teacher_id);

-- Subject Info
ALTER TABLE public.subject_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subject info" ON public.subject_info FOR SELECT USING (true);
CREATE POLICY "Teachers can insert subject info" ON public.subject_info FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.subjects WHERE id = subject_id AND teacher_id = auth.uid()));
CREATE POLICY "Teachers can update subject info" ON public.subject_info FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.subjects WHERE id = subject_id AND teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete subject info" ON public.subject_info FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.subjects WHERE id = subject_id AND teacher_id = auth.uid()));

-- AI Chat Sessions
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own sessions" ON public.ai_chat_sessions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create sessions" ON public.ai_chat_sessions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own sessions" ON public.ai_chat_sessions FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students can delete own sessions" ON public.ai_chat_sessions FOR DELETE USING (auth.uid() = student_id);

-- AI Messages
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own messages" ON public.ai_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ai_chat_sessions WHERE id = session_id AND student_id = auth.uid()));
CREATE POLICY "Students can insert messages" ON public.ai_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_chat_sessions WHERE id = session_id AND student_id = auth.uid()));

-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view conversations" ON public.conversations FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = teacher_id);
CREATE POLICY "Students can create conversations" ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE
  USING (auth.uid() = student_id OR auth.uid() = teacher_id);

-- Direct Messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view direct messages" ON public.direct_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND (student_id = auth.uid() OR teacher_id = auth.uid())
  ));
CREATE POLICY "Participants can send direct messages" ON public.direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id AND (student_id = auth.uid() OR teacher_id = auth.uid())
    )
  );
CREATE POLICY "Recipients can update read status" ON public.direct_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND (student_id = auth.uid() OR teacher_id = auth.uid())
  ));

-- ============================================
-- Enable Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
