'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import type { Subject, SubjectInfo } from '@/types'

const CATEGORIES = [
  { value: 'exam', label: 'Exam', variant: 'danger' as const },
  { value: 'room', label: 'Room', variant: 'primary' as const },
  { value: 'schedule', label: 'Schedule', variant: 'success' as const },
  { value: 'announcement', label: 'Announcement', variant: 'warning' as const },
  { value: 'general', label: 'General', variant: 'default' as const },
]

export default function SubjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useUser()
  const subjectId = params.subjectId as string

  const [subject, setSubject] = useState<Subject | null>(null)
  const [infoList, setInfoList] = useState<SubjectInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState('general')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async () => {
    const supabase = createClient()

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .single()

    if (subjectData) setSubject(subjectData as Subject)

    const { data: infoData } = await supabase
      .from('subject_info')
      .select('*')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })

    if (infoData) setInfoList(infoData as SubjectInfo[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [subjectId])

  const openCreate = () => {
    setEditingId(null)
    setFormTitle('')
    setFormContent('')
    setFormCategory('general')
    setError('')
    setShowModal(true)
  }

  const openEdit = (info: SubjectInfo) => {
    setEditingId(info.id)
    setFormTitle(info.title)
    setFormContent(info.content)
    setFormCategory(info.category)
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const supabase = createClient()

    if (editingId) {
      const { error: updateError } = await supabase
        .from('subject_info')
        .update({ title: formTitle, content: formContent, category: formCategory, updated_at: new Date().toISOString() })
        .eq('id', editingId)
      if (updateError) { setError(updateError.message); setSaving(false); return }
    } else {
      const { error: insertError } = await supabase
        .from('subject_info')
        .insert({ subject_id: subjectId, title: formTitle, content: formContent, category: formCategory })
      if (insertError) { setError(insertError.message); setSaving(false); return }
    }

    setShowModal(false)
    setSaving(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this information entry?')) return
    const supabase = createClient()
    await supabase.from('subject_info').delete().eq('id', id)
    fetchData()
  }

  if (loading) return <Spinner className="mt-12" />

  if (!subject) {
    return (
      <div className="text-center py-12">
        <p className="text-text-light">Subject not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/teacher/subjects')}>
          Back to Subjects
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/teacher/subjects')}
          className="p-2 rounded-xl hover:bg-surface-dark transition-colors"
        >
          <svg className="w-5 h-5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text">{subject.name}</h2>
          {subject.description && <p className="text-sm text-text-light">{subject.description}</p>}
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Info
        </Button>
      </div>

      {infoList.length === 0 ? (
        <Card className="text-center py-12">
          <svg className="w-12 h-12 text-text-light/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-text-light font-medium">No information added yet</p>
          <p className="text-sm text-text-light/70 mt-1">Add exam dates, room numbers, schedules and more</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {infoList.map((info) => {
            const cat = CATEGORIES.find(c => c.value === info.category) || CATEGORIES[4]
            return (
              <Card key={info.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={cat.variant}>{cat.label}</Badge>
                      <h4 className="font-medium text-text">{info.title}</h4>
                    </div>
                    <p className="text-sm text-text-light whitespace-pre-wrap">{info.content}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(info)}
                      className="p-2 rounded-lg hover:bg-surface-dark text-text-light hover:text-primary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(info.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-text-light hover:text-danger transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Information' : 'Add Information'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100">{error}</div>
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    formCategory === cat.value
                      ? 'bg-primary text-white'
                      : 'bg-surface-dark text-text-light hover:bg-border'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            id="infoTitle"
            label="Title"
            placeholder="e.g. Midterm Exam Date"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
          />
          <Textarea
            id="infoContent"
            label="Content"
            placeholder="e.g. March 15, 2026 at 9:00 AM in Room 105"
            rows={4}
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            required
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingId ? 'Save Changes' : 'Add Info'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
