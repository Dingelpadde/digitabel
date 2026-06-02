import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStudent } from '../../contexts/StudentContext'
import {
  getStudentAssignments,
  upsertStudentAssignment,
  getPrepAnswers,
  getChatMessages,
  getReflection,
} from '../../lib/supabase'
import { getAssignmentById } from '../../data/assignments'
import PrepForm from './PrepForm'
import ChatInterface from './ChatInterface'
import ReflectionForm from './ReflectionForm'

// Steps: prep → chat → reflection → done
const STEP = { PREP: 'prep', CHAT: 'chat', REFLECTION: 'reflection', DONE: 'done' }

export default function AssignmentDetail() {
  const { assignmentId } = useParams()
  const { student } = useStudent()
  const navigate = useNavigate()

  const assignment = getAssignmentById(assignmentId)
  const [studentAssignment, setStudentAssignment] = useState(null)
  const [step, setStep] = useState(null) // null = loading
  const [prepAnswers, setPrepAnswers] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [reflection, setReflection] = useState(null)

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

        const [answers, messages, ref] = await Promise.all([
          getPrepAnswers(sa.id),
          getChatMessages(sa.id),
          getReflection(sa.id),
        ])
        setPrepAnswers(answers)
        setChatMessages(messages)
        setReflection(ref)

        if (sa.status === 'cleared') {
          setStep(ref ? STEP.DONE : STEP.REFLECTION)
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
    setStep(STEP.REFLECTION)
  }

  const handleReflectionSaved = (ref) => {
    setReflection(ref)
    setStep(STEP.DONE)
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Assignment not found.</p>
      </div>
    )
  }

  const stepLabels = [
    { key: STEP.PREP, label: 'Prepare' },
    { key: STEP.CHAT, label: 'Spar' },
    { key: STEP.REFLECTION, label: 'Reflect' },
  ]
  const stepIndex = stepLabels.findIndex((s) => s.key === step)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate('/student')}
          className="text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium">Assignment {assignment.orderIndex}</p>
          <h1 className="text-base font-bold text-gray-900 truncate">{assignment.title}</h1>
        </div>
        <span className="text-xs text-gray-400 hidden sm:block">{student.name}</span>
      </header>

      {/* Step indicator */}
      {step && step !== STEP.DONE && (
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            {stepLabels.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                  i < stepIndex
                    ? 'bg-green-100 text-green-700'
                    : i === stepIndex
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < stepIndex && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {s.label}
                </div>
                {i < stepLabels.length - 1 && <div className="w-4 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        {step === null && (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
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

        {step === STEP.REFLECTION && studentAssignment && (
          <ReflectionForm
            assignment={assignment}
            studentAssignment={studentAssignment}
            onSaved={handleReflectionSaved}
          />
        )}

        {step === STEP.DONE && (
          <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All done!</h2>
            <p className="text-gray-500 mb-6">
              You've completed the AI sparring and reflection for <strong>{assignment.title}</strong>.
              You're ready for supervision.
            </p>
            {reflection && (
              <div className="card p-5 text-left mb-6 space-y-4">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Your reflections</h3>
                {[
                  { label: 'What did you learn?', value: reflection.what_learned },
                  { label: 'What did you change?', value: reflection.what_changed },
                  { label: 'What would you do differently?', value: reflection.what_differently },
                ].map((r) => (
                  <div key={r.label}>
                    <p className="text-xs font-medium text-gray-500">{r.label}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{r.value}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate('/student')} className="btn-primary">
              Back to assignments
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
