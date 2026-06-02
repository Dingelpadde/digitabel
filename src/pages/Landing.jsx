import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

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
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              background: 'var(--color-surface)',
              border: '2px solid var(--color-frame)',
              boxShadow: '4px 4px 0 var(--color-frame-dark)',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 24,
                color: 'var(--color-accent)',
                lineHeight: 1,
              }}
            >
              D
            </span>
          </div>

          <div
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 14,
              color: 'var(--color-accent)',
              letterSpacing: '0.08em',
              marginBottom: 10,
              lineHeight: 1.8,
            }}
          >
            DIGITABEL
          </div>

          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.6 }}>
            AI-læringsassistent for DiP-programmet<br />
            Fagskolen Kristiania
          </p>
        </div>

        {/* Valg */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 7,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Hvem er du?
          </p>

          {/* Student-knapp */}
          <button
            onClick={() => navigate('/student')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              background: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
              cursor: 'pointer',
              transition: 'border-color 120ms, box-shadow 120ms, transform 80ms',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)'
              e.currentTarget.style.boxShadow = '4px 4px 0 var(--color-frame-dark)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,0.4)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)'
              e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,0.4)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'none'
            }}
          >
            <div
              style={{
                width: 44, height: 44, flexShrink: 0,
                background: 'var(--color-bg)',
                border: '2px solid var(--color-accent)',
                boxShadow: '2px 2px 0 #000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Press Start 2P"', fontSize: 16, color: 'var(--color-accent)',
              }}
            >
              S
            </div>
            <div>
              <p
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 8,
                  color: 'var(--color-text)',
                  marginBottom: 6,
                  lineHeight: 1.6,
                }}
              >
                Student
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Spar med Digitabel før veiledning
              </p>
            </div>
          </button>

          {/* Faglærer-knapp */}
          <button
            onClick={() => navigate('/teacher')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              background: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
              cursor: 'pointer',
              transition: 'border-color 120ms, box-shadow 120ms, transform 80ms',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-text-muted)'
              e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,0.4)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)'
              e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,0.4)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'none'
            }}
          >
            <div
              style={{
                width: 44, height: 44, flexShrink: 0,
                background: 'var(--color-bg)',
                border: '2px solid var(--color-text-muted)',
                boxShadow: '2px 2px 0 #000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Press Start 2P"', fontSize: 16, color: 'var(--color-text-muted)',
              }}
            >
              F
            </div>
            <div>
              <p
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 8,
                  color: 'var(--color-text)',
                  marginBottom: 6,
                  lineHeight: 1.6,
                }}
              >
                Faglærer
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Dashboardet for Abel Romsaas
              </p>
            </div>
          </button>
        </div>

        <p
          style={{
            marginTop: 32,
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.08em',
            lineHeight: 2,
          }}
        >
          Powered by Claude · Built for education
        </p>
      </div>
    </div>
  )
}
