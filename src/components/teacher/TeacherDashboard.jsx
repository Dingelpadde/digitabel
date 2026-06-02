import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getStudents } from '../../lib/supabase'
import { ASSIGNMENTS } from '../../data/assignments'
import StatusBadge from '../shared/StatusBadge'

// ── Pixel progress bar ────────────────────────────────────────────────────────
function PixelProgressBar({ pct, color = '#6ab04c' }) {
  return (
    <div
      style={{
        height: 10,
        background: 'var(--color-bg)',
        border: '2px solid var(--color-border)',
        boxShadow: '2px 2px 0 #000',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          transition: 'width 400ms steps(10)',
        }}
      />
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ activeView, onSetView, onLogout }) {
  const navItems = [
    { id: 'overview', label: 'Oversikt' },
    { id: 'students', label: 'Studenter' },
    { id: 'warnings', label: 'Varsler' },
  ]

  return (
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
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '2px solid var(--color-border)',
        }}
      >
        <div
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 10,
            color: 'var(--color-accent)',
            letterSpacing: '0.06em',
            lineHeight: 1.8,
            marginBottom: 4,
          }}
        >
          DIGITABEL
        </div>
        <p style={{ fontFamily: '"Press Start 2P"', fontSize: 6, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
          FAGLÆRERDASHBOARD
        </p>
      </div>

      {/* Navigasjon */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {navItems.map((item) => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSetView(item.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 16px',
                background: isActive ? 'var(--color-bg)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                borderRight: 'none',
                borderTop: 'none',
                borderBottom: 'none',
                cursor: 'pointer',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 7,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                letterSpacing: '0.05em',
                lineHeight: 1.8,
                transition: 'color 100ms',
              }}
            >
              {item.label}
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
  )
}

// ── Hoved-komponent ───────────────────────────────────────────────────────────
export default function TeacherDashboard({ onLogout }) {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(null)
  const [sentNotices, setSentNotices] = useState(new Set())
  const [activeView, setActiveView] = useState('overview')

  const loadData = useCallback(async () => {
    try {
      const [studentsData, { data: saRows }] = await Promise.all([
        getStudents(),
        supabase.from('student_assignments').select('student_id, assignment_id, status'),
      ])
      setStudents(studentsData || [])
      const map = {}
      ;(saRows || []).forEach((row) => {
        if (!map[row.student_id]) map[row.student_id] = {}
        map[row.student_id][row.assignment_id] = row.status
      })
      setStatusMap(map)
    } catch {
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('student_assignments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_assignments' }, loadData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadData])

  const getStatus = (studentId, assignmentId) =>
    statusMap[studentId]?.[assignmentId] || 'not_started'

  const getAssignmentStats = (assignmentId) => {
    const cleared    = students.filter((s) => getStatus(s.id, assignmentId) === 'cleared').length
    const inProgress = students.filter((s) => getStatus(s.id, assignmentId) === 'in_progress').length
    const notStarted = students.filter((s) => getStatus(s.id, assignmentId) === 'not_started').length
    return { cleared, inProgress, notStarted, total: students.length }
  }

  const getNotStartedStudents = (assignmentId) =>
    students.filter((s) => getStatus(s.id, assignmentId) === 'not_started')

  const sendReminder = async (assignmentId) => {
    const notStarted = getNotStartedStudents(assignmentId)
    if (!notStarted.length) return
    setSending(assignmentId)
    try {
      await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: notStarted.map((s) => s.id), assignmentId }),
      })
      setSentNotices((prev) => new Set([...prev, assignmentId]))
    } catch (err) {
      console.error('Klarte ikke sende påminnelse:', err)
    } finally {
      setSending(null)
    }
  }

  // Studenter som ikke har startet noe
  const inactiveStudents = students.filter((s) =>
    ASSIGNMENTS.every((a) => getStatus(s.id, a.id) === 'not_started')
  )

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
      <Sidebar activeView={activeView} onSetView={setActiveView} onLogout={onLogout} />

      {/* Hovedinnhold */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

        {/* Topbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: '"Press Start 2P"',
                fontSize: 11,
                color: 'var(--color-text)',
                letterSpacing: '0.05em',
                lineHeight: 1.8,
                marginBottom: 4,
              }}
            >
              {activeView === 'overview' && 'Oversikt'}
              {activeView === 'students' && 'Alle studenter'}
              {activeView === 'warnings' && 'Varsler'}
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {students.length} studenter · {ASSIGNMENTS.length} oppgaver
            </p>
          </div>
          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ fontSize: 7, padding: '8px 14px' }}
          >
            Oppdater
          </button>
        </div>

        {students.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Ingen studenter funnet.</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 6 }}>
              Sørg for at Supabase er konfigurert og at studenter har logget inn.
            </p>
          </div>
        ) : (
          <>
            {/* ── OVERSIKT ─────────────────────────────────────────────── */}
            {activeView === 'overview' && (
              <div>
                {/* Stats-kort øverst */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                  {[
                    {
                      label: 'Totalt clearede',
                      value: students.reduce((acc, s) =>
                        acc + ASSIGNMENTS.filter((a) => getStatus(s.id, a.id) === 'cleared').length, 0
                      ),
                      color: '#6ab04c',
                    },
                    {
                      label: 'Pågår nå',
                      value: students.reduce((acc, s) =>
                        acc + ASSIGNMENTS.filter((a) => getStatus(s.id, a.id) === 'in_progress').length, 0
                      ),
                      color: '#f0a500',
                    },
                    {
                      label: 'Inaktive studenter',
                      value: inactiveStudents.length,
                      color: inactiveStudents.length > 0 ? '#e74c3c' : '#6ab04c',
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="card" style={{ padding: '20px 16px' }}>
                      <div
                        style={{
                          fontFamily: '"Press Start 2P"',
                          fontSize: 22,
                          color: stat.color,
                          marginBottom: 8,
                          lineHeight: 1,
                        }}
                      >
                        {stat.value}
                      </div>
                      <p style={{ fontFamily: '"Press Start 2P"', fontSize: 6, color: 'var(--color-text-muted)', letterSpacing: '0.05em', lineHeight: 1.8 }}>
                        {stat.label.toUpperCase()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Oppgave-progress-kort */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {ASSIGNMENTS.map((a) => {
                    const stats = getAssignmentStats(a.id)
                    const pct = stats.total > 0 ? Math.round((stats.cleared / stats.total) * 100) : 0
                    const notStarted = getNotStartedStudents(a.id)
                    const wasSent = sentNotices.has(a.id)
                    return (
                      <div key={a.id} className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: '"Press Start 2P"', fontSize: 6, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.05em' }}>
                              OPPGAVE {a.orderIndex}
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, lineHeight: 1.4 }}>
                              {a.title}
                            </p>
                          </div>
                          <span
                            style={{
                              fontFamily: '"Press Start 2P"',
                              fontSize: 16,
                              color: pct === 100 ? '#6ab04c' : 'var(--color-accent)',
                              marginLeft: 12,
                              flexShrink: 0,
                            }}
                          >
                            {pct}%
                          </span>
                        </div>

                        <PixelProgressBar pct={pct} color={pct === 100 ? '#6ab04c' : '#e8b87a'} />

                        <div style={{ display: 'flex', gap: 12, fontSize: 11, marginTop: 10, marginBottom: 12 }}>
                          <span style={{ color: '#6ab04c' }}>{stats.cleared} cleared</span>
                          <span style={{ color: '#f0a500' }}>{stats.inProgress} pågår</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>{stats.notStarted} ikke startet</span>
                        </div>

                        {notStarted.length > 0 && (
                          <button
                            onClick={() => sendReminder(a.id)}
                            disabled={sending === a.id || wasSent}
                            className="btn-secondary"
                            style={{ width: '100%', fontSize: 6, padding: '8px 12px' }}
                          >
                            {wasSent ? '✓ Påminnelse sendt' : sending === a.id ? 'Sender...' : `Påminn ${notStarted.length} student${notStarted.length !== 1 ? 'er' : ''}`}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── STUDENTER ────────────────────────────────────────────── */}
            {activeView === 'students' && (
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '2px solid var(--color-border)',
                  boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          fontFamily: '"Press Start 2P"',
                          fontSize: 6,
                          color: 'var(--color-text-muted)',
                          letterSpacing: '0.06em',
                          fontWeight: 'normal',
                        }}
                      >
                        STUDENT
                      </th>
                      {ASSIGNMENTS.map((a) => (
                        <th
                          key={a.id}
                          title={a.title}
                          style={{
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontFamily: '"Press Start 2P"',
                            fontSize: 6,
                            color: 'var(--color-text-muted)',
                            letterSpacing: '0.06em',
                            fontWeight: 'normal',
                          }}
                        >
                          {a.orderIndex}
                        </th>
                      ))}
                      <th
                        style={{
                          textAlign: 'center',
                          padding: '12px 16px',
                          fontFamily: '"Press Start 2P"',
                          fontSize: 6,
                          color: 'var(--color-text-muted)',
                          letterSpacing: '0.06em',
                          fontWeight: 'normal',
                        }}
                      >
                        CLEARED
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => {
                      const clearedCount = ASSIGNMENTS.filter(
                        (a) => getStatus(student.id, a.id) === 'cleared'
                      ).length
                      const isAll = clearedCount === ASSIGNMENTS.length
                      return (
                        <tr
                          key={student.id}
                          onClick={() => navigate(`/teacher/student/${student.id}`)}
                          style={{
                            borderBottom: idx < students.length - 1 ? '1px solid var(--color-border)' : 'none',
                            cursor: 'pointer',
                            transition: 'background 80ms',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-alt)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 500 }}>
                            {student.name}
                          </td>
                          {ASSIGNMENTS.map((a) => (
                            <td key={a.id} style={{ textAlign: 'center', padding: '12px 8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <StatusBadge status={getStatus(student.id, a.id)} compact />
                              </div>
                            </td>
                          ))}
                          <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                            <span
                              style={{
                                fontFamily: '"Press Start 2P"',
                                fontSize: 8,
                                color: isAll ? '#6ab04c' : 'var(--color-text-muted)',
                              }}
                            >
                              {clearedCount}/{ASSIGNMENTS.length}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p style={{ padding: '8px 16px', fontSize: 11, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
                  Tall 1–{ASSIGNMENTS.length} = oppgavenummer · Klikk en rad for detaljer
                </p>
              </div>
            )}

            {/* ── VARSLER ──────────────────────────────────────────────── */}
            {activeView === 'warnings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Inaktive studenter */}
                <div>
                  <p
                    style={{
                      fontFamily: '"Press Start 2P"',
                      fontSize: 7,
                      color: inactiveStudents.length > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                      letterSpacing: '0.06em',
                      marginBottom: 12,
                      lineHeight: 1.8,
                    }}
                  >
                    STUDENTER SOM IKKE HAR STARTET NOE
                  </p>
                  {inactiveStudents.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#6ab04c' }}>Ingen — alle har startet minst én oppgave.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {inactiveStudents.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => navigate(`/teacher/student/${s.id}`)}
                          style={{
                            background: 'rgba(231,76,60,0.1)',
                            border: '2px solid var(--color-danger)',
                            boxShadow: '3px 3px 0 #000',
                            color: 'var(--color-danger)',
                            fontSize: 12,
                            padding: '8px 14px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            transition: 'transform 80ms, box-shadow 80ms',
                          }}
                          onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'translate(2px, 2px)'
                            e.currentTarget.style.boxShadow = '1px 1px 0 #000'
                          }}
                          onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'none'
                            e.currentTarget.style.boxShadow = '3px 3px 0 #000'
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Oppgaver med lav fremgang */}
                <div>
                  <p
                    style={{
                      fontFamily: '"Press Start 2P"',
                      fontSize: 7,
                      color: 'var(--color-warning)',
                      letterSpacing: '0.06em',
                      marginBottom: 12,
                      lineHeight: 1.8,
                    }}
                  >
                    OPPGAVER MED LAV FREMGANG (&lt;30%)
                  </p>
                  {ASSIGNMENTS.filter((a) => {
                    const stats = getAssignmentStats(a.id)
                    return stats.total > 0 && (stats.cleared / stats.total) < 0.3
                  }).length === 0 ? (
                    <p style={{ fontSize: 13, color: '#6ab04c' }}>Ingen oppgaver under 30% fremgang.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {ASSIGNMENTS.filter((a) => {
                        const stats = getAssignmentStats(a.id)
                        return stats.total > 0 && (stats.cleared / stats.total) < 0.3
                      }).map((a) => {
                        const stats = getAssignmentStats(a.id)
                        const pct = Math.round((stats.cleared / stats.total) * 100)
                        const notStarted = getNotStartedStudents(a.id)
                        const wasSent = sentNotices.has(a.id)
                        return (
                          <div key={a.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, marginBottom: 4 }}>
                                {a.orderIndex}. {a.title}
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                {stats.cleared}/{stats.total} cleared · {pct}%
                              </p>
                            </div>
                            {notStarted.length > 0 && (
                              <button
                                onClick={() => sendReminder(a.id)}
                                disabled={sending === a.id || wasSent}
                                className="btn-secondary"
                                style={{ fontSize: 6, padding: '8px 12px', flexShrink: 0 }}
                              >
                                {wasSent ? '✓ Sendt' : sending === a.id ? '...' : `Påminn ${notStarted.length}`}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
