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
      setError('Please answer all questions before continuing. (Minimum 10 characters each.)')
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Preparation Questions</h2>
        <p className="text-gray-500 text-sm mt-1">
          Answer these questions thoughtfully before starting the AI sparring session.
          Your answers will be shared with Claude as context.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {assignment.prepQuestions.map((question, i) => (
          <div key={i} className="card p-5">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-brand-500 text-white rounded-full text-xs font-bold mr-2">
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
              placeholder="Write your answer here…"
              className="textarea"
            />
            <p className={`text-xs mt-1 ${answers[i].trim().length < 10 ? 'text-gray-400' : 'text-green-600'}`}>
              {answers[i].trim().length} characters
            </p>
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {answers.filter((a) => a.trim().length >= 10).length} of {assignment.prepQuestions.length} questions answered
          </p>
          <button
            type="submit"
            disabled={loading || !allFilled}
            className="btn-primary"
          >
            {loading ? 'Saving…' : 'Start AI Sparring'}
            {!loading && (
              <svg className="w-4 h-4 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
