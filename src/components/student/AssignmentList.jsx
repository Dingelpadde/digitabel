import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudent } from '../../contexts/StudentContext'
import { getStudentAssignments } from '../../lib/supabase'
import { ASSIGNMENTS } from '../../data/assignments'
import StatusBadge from '../shared/StatusBadge'

export default function AssignmentList() {
  const { student, logout } = useStudent()
  const navigate = useNavigate()
  const [statuses, setStatuses] = useState({}) // assignmentId -> status
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const rows = await getStudentAssignments(student.id)
        const map = {}
        rows.forEach((r) => { map[r.assignment_id] = r.status })
        setStatuses(map)
      } catch {
        // Supabase not configured — show all as not_started
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [student.id])

  const cleared = Object.values(statuses).filter((s) => s === 'cleared').length
  const inProgress = Object.values(statuses).filter((s) => s === 'in_progress').length
  const total = ASSIGNMENTS.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <span className="font-semibold text-gray-900 hidden sm:block">DigitABEL</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Hi, <strong>{student.name}</strong></span>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-700 underline">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress summary */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Assignments</h2>
          <p className="text-gray-500 text-sm">
            Complete the AI sparring session before each supervision meeting.
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
              <span className="text-gray-600">{cleared} cleared</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
              <span className="text-gray-600">{inProgress} in progress</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block"></span>
              <span className="text-gray-600">{total - cleared - inProgress} not started</span>
            </span>
          </div>
          {/* Overall progress bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${(cleared / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Assignment cards */}
        {loading ? (
          <div className="space-y-3">
            {ASSIGNMENTS.map((a) => (
              <div key={a.id} className="card p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {ASSIGNMENTS.map((assignment) => {
              const status = statuses[assignment.id] || 'not_started'
              return (
                <button
                  key={assignment.id}
                  onClick={() => navigate(`/student/assignment/${assignment.id}`)}
                  className="card p-4 w-full text-left hover:shadow-md hover:border-brand-200 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-brand-50 border border-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand-600">
                        {assignment.orderIndex}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                          {assignment.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                          {assignment.description}
                        </p>
                        {assignment.supervisionDate && (
                          <p className="text-xs text-gray-400 mt-1">
                            Supervision: {new Date(assignment.supervisionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
