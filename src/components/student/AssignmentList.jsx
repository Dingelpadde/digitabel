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
        // Supabase ikke konfigurert — vis alle som not_started
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [student.id])

  const cleared = Object.values(statuses).filter((s) => s === 'cleared').length
  const inProgress = Object.values(statuses).filter((s) => s === 'in_progress').length
  const total = ASSIGNMENTS.length
  const firstName = student.name.split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Topbar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--color-star)', fontSize: 15, lineHeight: 1 }}>✦</span>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, color: 'var(--color-text)' }}>DIGITABEL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Hei, <strong style={{ color: 'var(--color-text)' }}>{firstName}</strong>
          </span>
          <button
            onClick={logout}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Logg ut
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
        {/* Oppsummering */}
        <div style={{ marginBottom: 28 }}>
          <h2 className="display-title" style={{ fontSize: 26, margin: 0 }}>Temaoppgavene dine</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 6, lineHeight: 1.55 }}>
            Ta en runde med Digitabel før hver veiledning med Abel.
          </p>

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)' }}>
              <span style={{ width: 8, height: 8, background: '#6ab04c', display: 'inline-block' }} /> {cleared} cleared
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)' }}>
              <span style={{ width: 8, height: 8, background: '#e8a030', display: 'inline-block' }} /> {inProgress} pågår
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)' }}>
              <span style={{ width: 8, height: 8, background: 'var(--color-border)', display: 'inline-block' }} /> {total - cleared - inProgress} ikke startet
            </span>
          </div>

          {/* Fremdriftsindikator */}
          <div style={{ marginTop: 14, height: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: '#6ab04c',
                width: `${total ? (cleared / total) * 100 : 0}%`,
                transition: 'width 500ms steps(8)',
              }}
            />
          </div>
        </div>

        {/* Oppgavekort */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ASSIGNMENTS.map((a) => (
              <div key={a.id} className="card" style={{ opacity: 0.5 }}>
                <div style={{ height: 14, background: 'var(--color-surface-alt)', width: '50%', marginBottom: 10 }} />
                <div style={{ height: 10, background: 'var(--color-surface-alt)', width: '75%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ASSIGNMENTS.map((assignment) => {
              const status = statuses[assignment.id] || 'not_started'
              return (
                <button
                  key={assignment.id}
                  onClick={() => navigate(`/student/assignment/${assignment.id}`)}
                  className="card"
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--color-text)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: 34, height: 34, flexShrink: 0,
                          background: 'var(--color-bg)',
                          border: '2px solid var(--color-chroma-pink)',
                          boxShadow: '2px 2px 0 var(--color-chroma-blue)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-pixel)', fontSize: 11, color: 'var(--color-accent)',
                        }}
                      >
                        {assignment.orderIndex}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-text)', margin: 0 }}>
                          {assignment.title}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                          {assignment.description}
                        </p>
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

      <div className="grain" aria-hidden="true" />
    </div>
  )
}
