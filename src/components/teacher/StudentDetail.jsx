import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  supabase,
  getPrepAnswers,
  getChatMessages,
} from '../../lib/supabase'
import { ASSIGNMENTS } from '../../data/assignments'
import StatusBadge from '../shared/StatusBadge'

export default function StudentDetail({ onLogout }) {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [studentAssignments, setStudentAssignments] = useState([])
  const [selected, setSelected] = useState(null)
  const [saRecord, setSaRecord] = useState(null)
  const [prepAnswers, setPrepAnswers] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [{ data: stu }, { data: sa }] = await Promise.all([
          supabase.from('students').select('*').eq('id', studentId).single(),
          supabase.from('student_assignments').select('*').eq('student_id', studentId),
        ])
        setStudent(stu)
        setStudentAssignments(sa || [])
      } catch {
        setStudent({ id: studentId, name: 'Student' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  const selectAssignment = async (assignment) => {
    setSelected(assignment)
    setDetailLoading(true)
    const sa = studentAssignments.find((r) => r.assignment_id === assignment.id)
    setSaRecord(sa || null)
    if (!sa) {
      setPrepAnswers([])
      setChatMessages([])
      setReflection(null)
      setDetailLoading(false)
      return
    }
    try {
      const [answers, messages] = await Promise.all([
        getPrepAnswers(sa.id),
        getChatMessages(sa.id),
      ])
      setPrepAnswers(answers)
      setChatMessages(messages)
    } catch {
      setPrepAnswers([])
      setChatMessages([])
    } finally {
      setDetailLoading(false)
    }
  }

  const getStatus = (assignmentId) =>
    studentAssignments.find((r) => r.assignment_id === assignmentId)?.status || 'not_started'

  const clearedCount = studentAssignments.filter((s) => s.status === 'cleared').length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: '"Press Start 2P"', fontSize: 8, color: 'var(--color-accent)', letterSpacing: '0.08em' }}>
          LASTER...
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: 'var(--color-surface)',
          borderRight: '2px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Tilbake + student-info */}
        <div style={{ padding: '16px', borderBottom: '2px solid var(--color-border)' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"Press Start 2P"',
              fontSize: 6,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.05em',
              marginBottom: 14,
              padding: 0,
            }}
          >
            ← Tilbake
          </button>

          <div
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 8,
              color: 'var(--color-text)',
              lineHeight: 1.8,
              marginBottom: 6,
            }}
          >
            {student?.name}
          </div>
          <p style={{ fontFamily: '"Press Start 2P"', fontSize: 6, color: 'var(--color-text-muted)', letterSpacing: '0.04em', lineHeight: 1.8 }}>
            {clearedCount}/{ASSIGNMENTS.length} CLEARED
          </p>
        </div>

        {/* Oppgave-liste */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          <p
            style={{
              fontFamily: '"Press Start 2P"',
              fontSize: 6,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.06em',
              padding: '0 16px 8px',
            }}
          >
            OPPGAVER
          </p>
          {ASSIGNMENTS.map((a) => {
            const status = getStatus(a.id)
            const isActive = selected?.id === a.id
            return (
              <button
                key={a.id}
                onClick={() => selectAssignment(a)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 16px',
                  background: isActive ? 'var(--color-bg)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                  borderRight: 'none',
                  borderTop: 'none',
                  borderBottom: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 10,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: '"Press Start 2P"',
                      fontSize: 6,
                      color: 'var(--color-text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {a.orderIndex}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.title}
                  </span>
                </span>
                <StatusBadge status={status} compact />
              </button>
            )
          })}
        </nav>

        {/* Logg ut */}
        <div style={{ padding: '16px', borderTop: '2px solid var(--color-border)' }}>
          <button
            onClick={onLogout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"Press Start 2P"',
              fontSize: 6,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.05em',
              textDecoration: 'underline',
            }}
          >
            Logg ut
          </button>
        </div>
      </aside>

      {/* Detaljpanel */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {!selected ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: '"Press Start 2P"', fontSize: 8, color: 'var(--color-text-muted)', lineHeight: 2 }}>
              Velg en oppgave i sidemenyen
            </p>
          </div>
        ) : detailLoading ? (
          <div className="card" style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: '"Press Start 2P"', fontSize: 8, color: 'var(--color-accent)', letterSpacing: '0.08em' }}>
              LASTER...
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Oppgave-header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ fontFamily: '"Press Start 2P"', fontSize: 6, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>
                  OPPGAVE {selected.orderIndex}
                </p>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 }}>
                  {selected.title}
                </h2>
              </div>
              <StatusBadge status={getStatus(selected.id)} />
            </div>

            {/* Synopsis */}
            {saRecord?.synopsis && (
              <section
                className="card-featured"
                style={{ padding: 20 }}
              >
                <p
                  style={{
                    fontFamily: '"Press Start 2P"',
                    fontSize: 7,
                    color: 'var(--color-chroma-pink)',
                    letterSpacing: '0.06em',
                    marginBottom: 14,
                  }}
                >
                  SYNOPSIS
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text)',
                    lineHeight: 1.75,
                    fontFamily: 'var(--font-body)',
                    margin: 0,
                  }}
                >
                  {saRecord.synopsis}
                </p>
              </section>
            )}

            {/* Forberedelsessvar */}
            <section className="card" style={{ padding: 20 }}>
              <p
                style={{
                  fontFamily: '"Press Start 2P"',
                  fontSize: 7,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.06em',
                  marginBottom: 16,
                }}
              >
                FORBEREDELSESSVAR
              </p>
              {prepAnswers.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Ingen forberedelsessvar ennå.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {prepAnswers.map((a) => (
                    <div key={a.id}>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>
                        {a.question_text}
                      </p>
                      <div
                        style={{
                          background: 'var(--color-bg)',
                          border: '2px solid var(--color-border)',
                          boxShadow: '2px 2px 0 #000',
                          padding: '10px 14px',
                          fontSize: 13,
                          color: 'var(--color-text)',
                          lineHeight: 1.6,
                        }}
                      >
                        {a.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Samtalehistorikk */}
            <section className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <p
                  style={{
                    fontFamily: '"Press Start 2P"',
                    fontSize: 7,
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.06em',
                  }}
                >
                  SAMTALE MED DIGITABEL
                </p>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  ({chatMessages.length} meldinger)
                </span>
              </div>
              {chatMessages.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Ingen samtale ennå.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        gap: 10,
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          flexShrink: 0,
                          background: 'var(--color-bg)',
                          border: `2px solid ${msg.role === 'assistant' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          boxShadow: '1px 1px 0 #000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: '"Press Start 2P"',
                          fontSize: 6,
                          color: msg.role === 'assistant' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        }}
                      >
                        {msg.role === 'assistant' ? 'A' : 'S'}
                      </div>
                      <div
                        className={msg.role === 'assistant' ? 'bubble-in' : 'bubble-out'}
                        style={{ fontSize: 12 }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>


          </div>
        )}
      </main>
    </div>
  )
}
