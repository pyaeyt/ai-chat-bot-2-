'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import type { Subject } from '@/types'

export default function TeacherSubjectsPage() {
  const { profile } = useUser()
  const router = useRouter()
  const [subjects, setSubjects] = useState<(Subject & { info_count: number })[]>([])
  const [subjectQuery, setSubjectQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchSubjects = async () => {
    if (!profile) return
    const supabase = createClient()
    const { data } = await supabase
      .from('subjects')
      .select('*, subject_info(count)')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false })

    if (data) {
      const mapped = data.map((s: any) => ({
        ...s,
        info_count: s.subject_info?.[0]?.count || 0,
      }))
      setSubjects(mapped)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSubjects()
  }, [profile])

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase()
    if (!q) return subjects
    return subjects.filter((s) => {
      const name = s.name.toLowerCase()
      const desc = (s.description || '').toLowerCase()
      return name.includes(q) || desc.includes(q)
    })
  }, [subjects, subjectQuery])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setError('')
    setSaving(true)

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('subjects')
      .insert({ teacher_id: profile.id, name: newName, description: newDesc || null })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setShowModal(false)
    setNewName('')
    setNewDesc('')
    setSaving(false)
    fetchSubjects()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subject and all its information?')) return
    const supabase = createClient()
    await supabase.from('subjects').delete().eq('id', id)
    fetchSubjects()
  }

  if (loading) return <Spinner className="mt-12" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-text">Your Subjects</h2>
          <p className="text-sm text-text-light mt-1">Manage courses and add information for students</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto shrink-0 touch-manipulation">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Subject
        </Button>
      </div>

      {subjects.length === 0 ? (
        <Card className="text-center py-12">
          <svg className="w-12 h-12 text-text-light/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-text-light font-medium">No subjects yet</p>
          <p className="text-sm text-text-light/70 mt-1">Add your first subject to get started</p>
        </Card>
      ) : (
        <>
          <div className="relative w-full max-w-md mb-4">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="search"
              value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
              placeholder="Search your subjects…"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-text placeholder:text-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              aria-label="Search subjects"
            />
          </div>

          {filteredSubjects.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-text-light">No subjects match &ldquo;{subjectQuery.trim()}&rdquo;.</p>
              <button
                type="button"
                onClick={() => setSubjectQuery('')}
                className="text-sm text-primary font-medium mt-2 hover:underline"
              >
                Clear search
              </button>
            </Card>
          ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} hover onClick={() => router.push(`/teacher/subjects/${subject.id}`)}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text truncate">{subject.name}</h3>
                  {subject.description && (
                    <p className="text-sm text-text-light mt-1 line-clamp-2">{subject.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="primary">{subject.info_count} info entries</Badge>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(subject.id)
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 text-text-light hover:text-danger transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Subject">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100">{error}</div>
          )}
          <Input
            id="subjectName"
            label="Subject Name"
            placeholder="e.g. Mathematics 101"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <Textarea
            id="subjectDesc"
            label="Description (optional)"
            placeholder="Brief description of the subject"
            rows={3}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Subject</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
