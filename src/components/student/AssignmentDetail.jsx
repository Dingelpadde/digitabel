import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStudent } from '../../contexts/StudentContext'
import {
  getStudentAssignments,
  upsertStudentAssignment,
  getPrepAnswers,
  getChatMessages,
} from '../../lib/supabase'
import { getAssignmentById } from '../../data/assignments'
import PrepForm from './PrepForm'
import ChatInterface from './ChatInterface'

// Steps: prep → chat → done
const STEP = { PREP: 'prep', CHAT: 'chat', DONE: 'done' }

export default function AssignmentDetail() {
  const { assignmentId } = useParams()
  const { student } = useStudent()
  const navigate = useNavigate()

  const assignment = getAssignmentById(assignmentId)
  const [studentAssignment, setStudentAssignment] = useState(null)
  const [step, setStep] = useState(null) // null = loading
  const [prepAnswers, setPrepAnswers] = useState([])
  const [chatMessages, setChatMessages] = useState([])

  useEffect(() => {
    if (!assignment) return
    async function load() {
      try {
        const rows = await getStudentAssignments(student.id)
        const sa = rows.find((r) => r.assignment_id === assignmentId)

        if (!sa || sa.status === 'not_started') {
          setStep(STEP.PREP)
          setStudentAssignment(sa || null)
          return
        }

        setStudentAssignment(sa)

        const [answers, messages] = await Promise.all([
          getPrepAnswers(sa.id),
          getChatMessages(sa.id),
        ])
        setPrepAnswers(answers)
        setChatMessages(messages)

        if (sa.status === 'cleared') {
          setStep(STEP.DONE)
        } else {
          setStep(STEP.CHAT)
        }
      } catch {
        setStep(STEP.PREP)
      }
    }
    load()
  }, [assignmentId, student.id, assignment])

  const handlePrepComplete = async (answers, sa) => {
    setPrepAnswers(answers)
    setStudentAssignment(sa)
    setStep(STEP.CHAT)
  }

  const handleCleared = (sa, messages) => {
    setStudentAssignment(sa)
    setChatMessages(messages)
    setStep(STEP.DONE)
  }

  if (!assignment) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Fant ikke temaoppgaven.</p>
      </div>
    )
  }

  const stepLabels = [
    { key: STEP.PREP, label: 'Forbered' },
    { key: STEP.CHAT, label: 'Veiledning' },
  ]
  const stepIndex = stepLabels.findIndex((s) => s.key === step)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
        }}
      >
        <button
          onClick={() => navigate('/student')}
          aria-label="Tilbake"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="pixel-label" style={{ fontSize: 6 }}>Tema {assignment.orderIndex}</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-text)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {assignment.title}
          </h1>
        </div>
      </header>

      {/* Stegindikator */}
      {step && step !== STEP.DONE && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
          <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {stepLabels.map((s, i) => {
              const done = i < stepIndex
              const active = i === stepIndex
              const color = done ? '#6ab04c' : active ? 'var(--color-chroma-pink)' : 'var(--color-text-muted)'
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '4px 8px',
                      color,
                      border: `1px solid ${color}`,
                      opacity: done || active ? 1 : 0.5,
                    }}
                  >
                    {done && '✓'} {s.label}
                  </span>
                  {i < stepLabels.length - 1 && <span style={{ width: 14, height: 1, background: 'var(--color-border)' }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Innhold */}
      <div style={{ flex: 1 }}>
        {step === null && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}

        {step === STEP.PREP && (
          <PrepForm
            assignment={assignment}
            student={student}
            onComplete={handlePrepComplete}
          />
        )}

        {step === STEP.CHAT && studentAssignment && (
          <ChatInterface
            assignment={assignment}
            studentAssignment={studentAssignment}
            prepAnswers={prepAnswers}
            initialMessages={chatMessages}
            onCleared={handleCleared}
          />
        )}

        {step === STEP.DONE && (
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 64, height: 64, margin: '0 auto 16px',
                background: 'rgba(106,176,76,0.12)',
                border: '2px solid #6ab04c',
                boxShadow: '3px 3px 0 #000',
              }}
            >
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#6ab04c">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="display-title" style={{ fontSize: 26, margin: '0 0 8px' }}>Alt klart!</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Du har fullført veiledningen med Digitabel for <strong style={{ color: 'var(--color-text)' }}>{assignment.title}</strong>.
              Du er klar for veiledningen med Abel.
            </p>
            <button onClick={() => navigate('/student')} className="btn-primary">
              Tilbake til oppgavene
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
