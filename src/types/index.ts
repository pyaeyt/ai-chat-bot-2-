export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'student' | 'teacher'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  teacher_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  teacher?: Profile
}

export interface SubjectInfo {
  id: string
  subject_id: string
  title: string
  content: string
  category: 'exam' | 'room' | 'schedule' | 'announcement' | 'general'
  created_at: string
  updated_at: string
}

export interface AiChatSession {
  id: string
  student_id: string
  subject_id: string
  title: string
  created_at: string
  updated_at: string
  subject?: Subject
}

export interface AiMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  needs_teacher: boolean
  created_at: string
}

export interface Conversation {
  id: string
  student_id: string
  teacher_id: string
  subject_id: string | null
  created_at: string
  updated_at: string
  student?: Profile
  teacher?: Profile
  subject?: Subject
  last_message?: DirectMessage
}

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
}
