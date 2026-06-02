import { useState } from 'react'
import { saveReflection } from '../../lib/supabase'

const QUESTIONS = [
  { key: 'whatLearned', label: 'What did you learn from the AI sparring session?' },
  { key: 'whatChanged', label: 'What did you change or clarify about your assignment idea as a result?' },
  { key: 'whatDifferently', label: 'What would you do differently next time to prepare better?' },
]

export default function ReflectionForm({ assignment, studentAssignment, onSaved }) {
  const [answers, setAnswers] = useState({ whatLearned: '', whatChanged: '', whatDifferently: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allFilled = Object.values(answers).every((v) => v.trim().length > 5)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allFilled) {
      setError('Please answer all three questions before submitting.')
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-semibold px-3 py-1.5 rounded-full mb-4">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Cleared for supervision
        </div>
        <h2 className="text-xl font-bold text-gray-900">Reflection</h2>
        <p className="text-gray-500 text-sm mt-1">
          Take a moment to reflect on the sparring session. These answers are saved and visible to your teacher.
          Honesty is more valuable than polish.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {QUESTIONS.map((q) => (
          <div key={q.key} className="card p-5">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              {q.label}
            </label>
            <textarea
              value={answers[q.key]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              rows={4}
              placeholder="Write your honest reflection here…"
              className="textarea"
            />
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !allFilled}
            className="btn-primary"
          >
            {loading ? 'Saving…' : 'Submit reflection'}
          </button>
        </div>
      </form>
    </div>
  )
}
