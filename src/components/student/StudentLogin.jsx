import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudent } from '../../contexts/StudentContext'
import { upsertStudent } from '../../lib/supabase'

const STEP_CONSENT = 'consent'
const STEP_REGISTER = 'register'
const STEP_RETURNING = 'returning'

export default function StudentLogin() {
  const { login } = useStudent()
  const navigate = useNavigate()

  // Sjekk om brukeren allerede har samtykket i denne nettleseren
  const hasConsented = Boolean(localStorage.getItem('digitabel_consent'))

  const [step, setStep] = useState(hasConsented ? STEP_RETURNING : STEP_CONSENT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Samtykke-tilstand
  const [consent, setConsent] = useState({ history: false, email: false, gdpr: false })

  // Registrerings-tilstand
  const [form, setForm] = useState({ name: '', email: '', kull: '' })

  // Tilbakevendende bruker — bare e-post
  const [returnEmail, setReturnEmail] = useState('')

  const allConsented = consent.history && consent.email && consent.gdpr

  const handleConsentContinue = () => {
    if (!allConsented) {
      setError('Du må krysse av for alle punktene for å fortsette.')
      return
    }
    setError('')
    setStep(STEP_REGISTER)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setError('Navn og e-post er obligatorisk.')
      return
    }
    setLoading(true)
    setError('')
    try {
      let studentData
      try {
        studentData = await upsertStudent({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          consent_given_at: new Date().toISOString(),
          kull: form.kull.trim(),
        })
      } catch {
        studentData = {
          id: `local-${form.email.trim().toLowerCase()}`,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
        }
      }
      localStorage.setItem('digitabel_consent', '1')
      login(studentData)
      navigate('/student')
    } catch (err) {
      setError('Noe gikk galt. Prøv igjen.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReturning = async (e) => {
    e.preventDefault()
    if (!returnEmail.trim()) {
      setError('Skriv inn e-postadressen din.')
      return
    }
    setLoading(true)
    setError('')
    try {
      let studentData
      try {
        // Hent student basert på e-post
        const { supabase } = await import('../../lib/supabase')
        const { data, error: sbErr } = await supabase
          .from('students')
          .select('*')
          .eq('email', returnEmail.trim().toLowerCase())
          .maybeSingle()
        if (sbErr || !data) throw new Error('Ikke funnet')
        studentData = data
      } catch {
        // Fallback — lokal stub
        studentData = {
          id: `local-${returnEmail.trim().toLowerCase()}`,
          name: returnEmail.trim(),
          email: returnEmail.trim().toLowerCase(),
        }
      }
      login(studentData)
      navigate('/student')
    } catch (err) {
      setError('Fant ikke kontoen din. Kontroller e-postadressen.')
      console.error(err)
    } finally {
      setLoading(false)
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
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            className="display-title glitch"
            data-text="DIGITABEL"
            style={{ fontSize: 'clamp(28px,9vw,40px)', lineHeight: 1, margin: '0 0 8px' }}
          >
            DIGITABEL
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.55 }}>
            {step === STEP_CONSENT && 'Velkommen! La oss starte med samtykkeerklæringen.'}
            {step === STEP_REGISTER && 'Registrer deg for å komme i gang.'}
            {step === STEP_RETURNING && 'Logg inn med e-postadressen din.'}
          </p>
        </div>

        {/* ─── STEG 1: Samtykke ─────────────────────────────── */}
        {step === STEP_CONSENT && (
          <div className="card-featured" style={{ padding: 24 }}>
            <p className="pixel-label" style={{ marginBottom: 16 }}>Samtykkeerklæring</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.7 }}>
              Digitabel er et læringsverktøy for DiP-programmet ved Fagskolen Kristiania.
              Les og kryss av for alle punktene nedenfor.
            </p>

            {[
              {
                key: 'history',
                label: 'Samtalehistorikk og opplastet materiale lagres og er synlig for faglærer (Abel Christoffer).',
              },
              {
                key: 'email',
                label: 'E-postadressen min brukes til faglige varsler og ukentlige oppdateringer.',
              },
              {
                key: 'gdpr',
                label: 'Personopplysningene mine behandles i henhold til Fagskolen Kristianias personvernpolicy. Samtykket kan trekkes tilbake via innstillinger.',
              },
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  marginBottom: 16,
                  cursor: 'pointer',
                }}
              >
                <div
                  onClick={() => setConsent((c) => ({ ...c, [key]: !c[key] }))}
                  style={{
                    width: 20,
                    height: 20,
                    minWidth: 20,
                    background: consent[key] ? 'var(--color-accent)' : 'var(--color-bg)',
                    border: `2px solid ${consent[key] ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    boxShadow: '2px 2px 0 #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {consent[key] && (
                    <span style={{ fontFamily: '"Press Start 2P"', fontSize: 8, color: 'var(--color-text-inv)' }}>✓</span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>{label}</span>
              </label>
            ))}

            {error && (
              <p style={{ color: 'var(--color-danger)', fontSize: 12, marginBottom: 12 }}>{error}</p>
            )}

            <button
              className="btn-primary"
              onClick={handleConsentContinue}
              style={{ width: '100%', marginTop: 8 }}
            >
              Jeg samtykker — gå videre
            </button>
          </div>
        )}

        {/* ─── STEG 2: Registrering ──────────────────────────── */}
        {step === STEP_REGISTER && (
          <div className="card" style={{ padding: 24 }}>
            <p className="pixel-label" style={{ marginBottom: 16 }}>Registrer deg</p>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  Fullt navn *
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ola Nordmann"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  E-postadresse *
                </label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="ola@student.kristiania.no"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  Kull
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.kull}
                  onChange={(e) => setForm((f) => ({ ...f, kull: e.target.value }))}
                  placeholder="f.eks. 2024–2025"
                />
              </div>

              {error && (
                <p style={{ color: 'var(--color-danger)', fontSize: 12 }}>{error}</p>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Registrerer...' : 'Opprett konto'}
              </button>
            </form>

            <button
              onClick={() => { setStep(STEP_CONSENT); setError('') }}
              style={{
                marginTop: 12,
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: 11,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ← Tilbake til samtykke
            </button>
          </div>
        )}

        {/* ─── TILBAKEVENDENDE BRUKER ─────────────────────────── */}
        {step === STEP_RETURNING && (
          <div className="card" style={{ padding: 24 }}>
            <p className="pixel-label" style={{ marginBottom: 16 }}>Logg inn</p>
            <form onSubmit={handleReturning} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  E-postadresse
                </label>
                <input
                  type="email"
                  className="input"
                  value={returnEmail}
                  onChange={(e) => setReturnEmail(e.target.value)}
                  placeholder="din@epost.no"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p style={{ color: 'var(--color-danger)', fontSize: 12 }}>{error}</p>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Logger inn...' : 'Fortsett'}
              </button>
            </form>

            <button
              onClick={() => {
                localStorage.removeItem('digitabel_consent')
                setStep(STEP_CONSENT)
                setError('')
              }}
              style={{
                marginTop: 12,
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: 11,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Ny student? Registrer deg her
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--color-text-muted)' }}>
          DiP-programmet · Fagskolen Kristiania
        </p>
      </div>

      <div className="grain" aria-hidden="true" />
    </div>
  )
}
