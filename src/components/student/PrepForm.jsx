import { useState } from 'react'
import { savePrepAnswers, upsertStudentAssignment } from '../../lib/supabase'

export default function PrepForm({ assignment, student, onComplete }) {
  const [answers, setAnswers] = useState(
    assignment.prepQuestions.map(() => '')
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allFilled = answers.every((a) => a.trim().length > 10)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allFilled) {
      setError('Svar på alle spørsmålene før du går videre. (Minst 10 tegn på hvert.)')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Create or update the student_assignment record
      const sa = await upsertStudentAssignment({
        studentId: student.id,
        assignmentId: assignment.id,
        status: 'in_progress',
      })

      // Save the prep answers
      const answerRows = answers.map((answer, i) => ({
        question_index: i,
        question_text: assignment.prepQuestions[i],
        answer,
      }))
      await savePrepAnswers(sa.id, answerRows)

      onComplete(answerRows, sa)
    } catch (err) {
      console.error(err)
      // If Supabase isn't configured, proceed locally
      const localSa = { id: `local-sa-${assignment.id}-${student.id}`, student_id: student.id, assignment_id: assignment.id, status: 'in_progress' }
      const answerRows = answers.map((answer, i) => ({
        question_index: i,
        question_text: assignment.prepQuestions[i],
        answer,
      }))
      onComplete(answerRows, localSa)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 className="display-title" style={{ fontSize: 22, margin: 0 }}>Forberedelsesspørsmål</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 6, lineHeight: 1.55 }}>
          Svar gjennomtenkt på disse før du starter veiledningen. Svarene gir Digitabel kontekst om hvor du står.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {assignment.prepQuestions.map((question, i) => {
          const ok = answers[i].trim().length >= 10
          return (
            <div key={i} className="card">
              <label style={{ display: 'block', fontSize: 14, color: 'var(--color-text)', marginBottom: 12, lineHeight: 1.5 }}>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, marginRight: 8, verticalAlign: 'middle',
                    background: 'var(--color-accent)', color: 'var(--color-text-inv)',
                    fontFamily: 'var(--font-pixel)', fontSize: 8,
                    boxShadow: '1px 1px 0 #000',
                  }}
                >
                  {i + 1}
                </span>
                {question}
              </label>
              <textarea
                value={answers[i]}
                onChange={(e) => {
                  const next = [...answers]
                  next[i] = e.target.value
                  setAnswers(next)
                }}
                rows={4}
                placeholder="Skriv svaret ditt her…"
                className="textarea"
              />
              <p style={{ fontSize: 11, marginTop: 6, color: ok ? '#6ab04c' : 'var(--color-text-muted)' }}>
                {answers[i].trim().length} tegn
              </p>
            </div>
          )
        })}

        {error && (
          <div
            style={{
              background: 'rgba(232,80,80,0.1)',
              border: '2px solid var(--color-danger)',
              boxShadow: '2px 2px 0 #000',
              padding: '12px 16px',
              fontSize: 13,
              color: 'var(--color-danger)',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {answers.filter((a) => a.trim().length >= 10).length} av {assignment.prepQuestions.length} besvart
          </p>
          <button type="submit" disabled={loading || !allFilled} className="btn-primary">
            {loading ? 'Lagrer…' : 'Start veiledning →'}
          </button>
        </div>
      </form>
    </div>
  )
}
