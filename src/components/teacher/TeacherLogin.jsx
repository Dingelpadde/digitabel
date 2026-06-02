import { useState } from 'react'

const TEACHER_PASSWORD = import.meta.env.VITE_TEACHER_PASSWORD || 'admin'

export default function TeacherLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === TEACHER_PASSWORD) {
      onLogin()
    } else {
      setError('Feil passord. Prøv igjen.')
      setPassword('')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              background: 'var(--color-surface)',
              border: '2px solid var(--color-text-muted)',
              boxShadow: '3px 3px 0 #000',
              marginBottom: 14,
            }}
          >
            <span style={{ fontFamily: '"Press Start 2P"', fontSize: 18, color: 'var(--color-text-muted)' }}>F</span>
          </div>
          <div
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9,
              color: 'var(--color-text)',
              letterSpacing: '0.06em',
              marginBottom: 8,
              lineHeight: 1.8,
            }}
          >
            FAGLÆRER
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            Logg inn på dashboardet
          </p>
        </div>

        {/* Skjema */}
        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: '"Press Start 2P"',
                  fontSize: 7,
                  color: 'var(--color-text-muted)',
                  marginBottom: 8,
                  letterSpacing: '0.06em',
                }}
              >
                PASSORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                autoFocus
              />
            </div>

            {error && (
              <p style={{ color: 'var(--color-danger)', fontSize: 12 }}>{error}</p>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Logg inn
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: 14,
            fontFamily: '"Press Start 2P"',
            fontSize: 6,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.06em',
            lineHeight: 2,
          }}
        >
          Sett via VITE_TEACHER_PASSWORD i .env
        </p>
      </div>
    </div>
  )
}
