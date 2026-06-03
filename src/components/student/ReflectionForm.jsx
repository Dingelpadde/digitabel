import { useState } from 'react'
import { saveReflection } from '../../lib/supabase'

const QUESTIONS = [
  { key: 'whatLearned', label: 'Hva lærte du av veiledningen med Digitabel?' },
  { key: 'whatChanged', label: 'Hva endret eller avklarte du rundt idéen din som følge av det?' },
  { key: 'whatDifferently', label: 'Hva ville du gjort annerledes neste gang for å forberede deg bedre?' },
]

export default function ReflectionForm({ assignment, studentAssignment, onSaved }) {
  const [answers, setAnswers] = useState({ whatLearned: '', whatChanged: '', whatDifferently: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allFilled = Object.values(answers).every((v) => v.trim().length > 5)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allFilled) {
      setError('Svar på alle tre spørsmålene før du sender inn.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const ref = await saveReflection(studentAssignment.id, answers)
      onSaved(ref)
    } catch {
      // Offline fallback
      onSaved({ ...answers, student_assignment_id: studentAssignment.id })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14,
            background: 'rgba(106,176,76,0.12)', border: '2px solid #6ab04c', boxShadow: '2px 2px 0 #000',
            color: '#6ab04c', fontFamily: 'var(--font-pixel)', fontSize: 7, padding: '5px 10px',
          }}
        >
          ✓ Klarert for veiledning
        </span>
        <h2 className="display-title" style={{ fontSize: 22, margin: 0 }}>Refleksjon</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 6, lineHeight: 1.55 }}>
          Ta et øyeblikk til å reflektere over veiledningen. Svarene lagres og er synlige for Abel.
          Ærlighet er mer verdt enn å skrive pent.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {QUESTIONS.map((q) => (
          <div key={q.key} className="card">
            <label style={{ display: 'block', fontSize: 14, color: 'var(--color-text)', marginBottom: 12, lineHeight: 1.5 }}>
              {q.label}
            </label>
            <textarea
              value={answers[q.key]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              rows={4}
              placeholder="Skriv din ærlige refleksjon her…"
              className="textarea"
            />
          </div>
        ))}

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

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={loading || !allFilled} className="btn-primary">
            {loading ? 'Lagrer…' : 'Send inn refleksjon'}
          </button>
        </div>
      </form>
    </div>
  )
}
