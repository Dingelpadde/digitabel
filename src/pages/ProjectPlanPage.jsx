import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MilestoneTimeline from '../components/student/MilestoneTimeline'

const SLOTS = [
  { id: 'tema-1-bildeserie',         label: 'Bildeserie',                          order: '01', supervisionDate: '2026-09-09' },
  { id: 'tema-2-film',               label: 'Film og postproduksjon',               order: '02', supervisionDate: '2026-10-22' },
  { id: 'tema-3-historiefortelling', label: 'Historiefortelling',                   order: '03', supervisionDate: null },
  { id: 'valgfritt',                 label: 'Valgfritt prosjekt',                   order: '04', supervisionDate: null },
]

const QUESTIONS = [
  {
    id: 'project',
    label: 'Hva jobber du med?',
    placeholder: 'F.eks. kortfilm for Nike, fotoserie for en lokal kafé...',
    type: 'textarea',
  },
  {
    id: 'deadline',
    label: 'Hva er innleveringsfristen?',
    placeholder: '',
    type: 'date',
  },
  {
    id: 'days',
    label: 'Hvilke dager kan du jobbe, og hvilke er du ikke tilgjengelig?',
    placeholder: 'F.eks. kan jobbe man, ons, fre. Ikke tilgjengelig torsdager og 20-22 jun.',
    type: 'textarea',
  },
  {
    id: 'time',
    label: 'Hvor mye tid vil du legge inn i prosjektet?',
    placeholder: 'F.eks. ca. 3 timer per dag, totalt rundt 40 timer...',
    type: 'textarea',
  },
]

const STORAGE_KEY = 'digitabel_project_plans'

function formatSupDate(iso) {
  const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
  const d = new Date(iso + 'T12:00:00')
  return `${d.getDate()}. ${months[d.getMonth()]}`
}

export default function ProjectPlanPage() {
  const navigate = useNavigate()
  const starsRef = useRef(null)

  // slots[0..3] = { plan, editUsed, answers } | null
  const [slots, setSlots] = useState([null, null, null, null])
  const [activeSlot, setActiveSlot] = useState(null) // null = picker, 0-3 = open slot

  const [step, setStep] = useState('form') // form | generating | plan | editing | done
  const [answers, setAnswers] = useState({ project: '', deadline: '', days: '', time: '' })
  const [plan, setPlan] = useState(null)
  const [editMsg, setEditMsg] = useState('')
  const [editUsed, setEditUsed] = useState(false)
  const [error, setError] = useState('')

  // Load saved slots from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setSlots(parsed)
      }
    } catch { /* ignore */ }
  }, [])

  // Stars effect
  useEffect(() => {
    const layer = starsRef.current
    if (!layer) return
    const palettes = [
      { c1: '#d6eaff', c2: '#5aa0ff', c3: '#2b5fd0' },
      { c1: '#e3d4ff', c2: '#b07ae8', c3: '#6a3fb0' },
      { c1: '#ffd9f2', c2: '#e87ad6', c3: '#b0468f' },
    ]
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    function spawn() {
      if (!layer || layer.childElementCount > 20) return
      const s = document.createElement('span')
      s.className = 'pstar'
      const pal = palettes[(Math.random() * palettes.length) | 0]
      const p = (2 + Math.random() * 3).toFixed(1)
      s.style.setProperty('--p', p + 'px')
      s.style.setProperty('--c1', pal.c1)
      s.style.setProperty('--c2', pal.c2)
      s.style.setProperty('--c3', pal.c3)
      s.style.left = Math.random() * 98 + 'vw'
      s.style.top = Math.random() * 96 + 'vh'
      s.style.animationDuration = (2 + Math.random() * 2.5).toFixed(2) + 's'
      layer.appendChild(s)
      s.addEventListener('animationend', () => s.remove())
    }
    let timers = []
    let interval
    if (!reduce) {
      for (let i = 0; i < 10; i++) timers.push(setTimeout(spawn, i * 150))
      interval = setInterval(spawn, 450)
    }
    return () => {
      timers.forEach(clearTimeout)
      if (interval) clearInterval(interval)
      if (layer) layer.innerHTML = ''
    }
  }, [])

  const openSlot = (i) => {
    setActiveSlot(i)
    const saved = slots[i]
    if (saved?.plan) {
      setPlan(saved.plan)
      setAnswers(saved.answers || { project: '', deadline: '', days: '', time: '' })
      setEditUsed(saved.editUsed || false)
      setStep('done')
    } else {
      setPlan(null)
      setAnswers({ project: '', deadline: '', days: '', time: '' })
      setEditUsed(false)
      setStep('form')
    }
    setError('')
    setEditMsg('')
  }

  const saveSlot = (i, newPlan, eu, ans) => {
    const updated = [...slots]
    updated[i] = { plan: newPlan, editUsed: eu, answers: ans }
    setSlots(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleDeleteSlot = () => {
    const updated = [...slots]
    updated[activeSlot] = null
    setSlots(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setActiveSlot(null)
  }

  const prepAnswersText = QUESTIONS
    .map((q) => `${q.label}\n${answers[q.id]}`)
    .join('\n\n')

  const generatePlan = async (editMessage = null) => {
    setError('')
    setStep(editMessage ? 'editing' : 'generating')
    const slot = SLOTS[activeSlot]
    const themeContext = slot.id !== 'valgfritt'
      ? { title: slot.label, supervisionDate: slot.supervisionDate }
      : null
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prepAnswers: prepAnswersText,
          themeContext,
          ...(editMessage ? { editMessage, existingPlan: plan } : {}),
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'API-feil')
      }
      const newPlan = await res.json()
      const eu = Boolean(editMessage)
      setPlan(newPlan)
      setEditUsed(eu)
      setStep(eu ? 'done' : 'plan')
      saveSlot(activeSlot, newPlan, eu, answers)
    } catch (err) {
      setError('Klarte ikke å generere plan. Sjekk at API-nøkkel er konfigurert.')
      setStep(editMessage ? 'plan' : 'form')
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!answers.project.trim() || !answers.deadline || !answers.days.trim() || !answers.time.trim()) {
      setError('Fyll inn alle feltene.')
      return
    }
    generatePlan()
  }

  const handleEdit = (e) => {
    e.preventDefault()
    if (!editMsg.trim()) return
    generatePlan(editMsg.trim())
    setEditMsg('')
  }

  const isGenerating = step === 'generating' || step === 'editing'
  const currentSlot = activeSlot !== null ? SLOTS[activeSlot] : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', position: 'relative' }}>
      <div className="stars" aria-hidden="true" ref={starsRef} />

      {/* Header */}
      <header
        className="no-print"
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
        }}
      >
        <button
          onClick={() => activeSlot !== null ? setActiveSlot(null) : navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', flexShrink: 0 }}
          aria-label="Tilbake"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="pixel-label" style={{ fontSize: 6 }}>
            {activeSlot !== null ? `Prosjektplanlegging · ${currentSlot.order}` : 'Digitabel'}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-text)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeSlot !== null
              ? (slots[activeSlot]?.answers?.project?.trim() || currentSlot.label)
              : 'Prosjektplanlegging'
            }
          </h1>
        </div>
        {activeSlot !== null && step === 'done' && slots[activeSlot] && (
          <button
            onClick={handleDeleteSlot}
            style={{
              background: 'none', border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)',
              fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '6px 10px', cursor: 'pointer', flexShrink: 0,
            }}
          >
            Slett plan
          </button>
        )}
      </header>

      {/* Main */}
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', padding: '32px 16px 48px' }}>

        {/* ── SLOT PICKER ── */}
        {activeSlot === null && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h2
                className="display-title glitch"
                data-text="Milepælplaner"
                style={{ fontSize: 'clamp(22px,6vw,30px)', margin: '0 0 8px', lineHeight: 1.05 }}
              >
                Milepælplaner
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Velg et prosjekt. Digitabel lager en realistisk plan med milepæler frem mot fristen.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {SLOTS.map((slot, i) => {
                const saved = slots[i]
                const projectLabel = saved?.answers?.project?.trim()
                return (
                  <button
                    key={slot.id}
                    onClick={() => openSlot(i)}
                    className="card"
                    style={{
                      padding: '18px 16px', textAlign: 'left', cursor: 'pointer',
                      width: '100%', display: 'flex', flexDirection: 'column', gap: 8,
                      transition: 'transform 80ms, box-shadow 80ms',
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translate(2px,2px)'
                      e.currentTarget.style.boxShadow = '2px 2px 0 #000'
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = ''
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 7, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
                      {slot.order}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>
                      {projectLabel || slot.label}
                    </span>
                    {slot.supervisionDate && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
                        Veiledning {formatSupDate(slot.supervisionDate)}
                      </span>
                    )}
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em',
                      textTransform: 'uppercase', marginTop: 4,
                      color: saved ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}>
                      {saved ? 'Se plan ✦' : 'Lag plan'}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── FORM ── */}
        {activeSlot !== null && step === 'form' && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h2 className="display-title" style={{ fontSize: 'clamp(20px,5vw,28px)', margin: '0 0 8px', lineHeight: 1.05 }}>
                {currentSlot.label}
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Svar på fire spørsmål, så lager Digitabel en realistisk milepælplan til deg.
                {currentSlot.supervisionDate && (
                  <> Veiledning med Abel er <strong style={{ color: 'var(--color-text)' }}>{formatSupDate(currentSlot.supervisionDate)}</strong>.</>
                )}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {QUESTIONS.map((q, i) => (
                <div key={q.id} className="card" style={{ padding: 20 }}>
                  <label style={{ display: 'block', marginBottom: 12 }}>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 22, height: 22, marginRight: 8, verticalAlign: 'middle',
                        background: 'var(--color-accent)', color: 'var(--color-text-inv)',
                        fontFamily: 'var(--font-pixel)', fontSize: 8, boxShadow: '1px 1px 0 #000',
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>
                      {q.label}
                    </span>
                  </label>
                  {q.type === 'date' ? (
                    <input
                      type="date"
                      className="input"
                      value={answers[q.id]}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      required
                    />
                  ) : (
                    <textarea
                      className="textarea"
                      rows={3}
                      placeholder={q.placeholder}
                      value={answers[q.id]}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      required
                    />
                  )}
                </div>
              ))}

              {error && (
                <p style={{ color: 'var(--color-danger)', fontSize: 12, fontFamily: 'var(--font-body)' }}>{error}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary">Lag plan →</button>
              </div>
            </form>
          </>
        )}

        {/* ── GENERATING / EDITING ── */}
        {activeSlot !== null && isGenerating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '60px 0' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {step === 'editing' ? 'Oppdaterer planen...' : 'Digitabel planlegger...'}
            </p>
          </div>
        )}

        {/* ── PLAN (vis tidslinje + rediger) ── */}
        {activeSlot !== null && step === 'plan' && plan && (
          <>
            <div style={{ marginBottom: 32 }}>
              <p className="pixel-label" style={{ marginBottom: 6 }}>Milepælplan</p>
              <MilestoneTimeline plan={plan} />
            </div>

            <div
              className="card no-print"
              style={{ padding: 20, marginTop: 16, borderColor: 'var(--color-chroma-blue)', boxShadow: '4px 4px 0 var(--color-chroma-blue)' }}
            >
              <p className="pixel-label" style={{ marginBottom: 12 }}>Endre noe? (én gang)</p>
              <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Beskriv hva du vil endre. F.eks: forskjøv fristen, har færre fridager..."
                  value={editMsg}
                  onChange={(e) => setEditMsg(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => { setStep('done'); saveSlot(activeSlot, plan, false, answers) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--color-text-muted)',
                    }}
                  >
                    Ferdig som den er
                  </button>
                  <button type="submit" className="btn-primary" disabled={!editMsg.trim()}>
                    Oppdater plan
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ── DONE ── */}
        {activeSlot !== null && step === 'done' && plan && (
          <>
            <div className="print-only" style={{ display: 'none', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#000' }}>
                Milepælplan — {currentSlot.label}
              </h2>
              <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', margin: 0 }}>
                Digitabel · {new Date().toLocaleDateString('no-NO')}
              </p>
            </div>

            <MilestoneTimeline plan={plan} />

            <div className="no-print" style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {editUsed && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
                  Plan oppdatert.
                </p>
              )}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => window.print()}>
                  Skriv ut plan
                </button>
                <button
                  className="btn-secondary"
                  disabled
                  title="Kommer snart"
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  Send e-postpåminnelser
                </button>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                E-postpåminnelser kommer snart.
              </p>
            </div>
          </>
        )}
      </main>

      <div className="grain no-print" aria-hidden="true" />

      <style>{`
        @media print {
          body { background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .stars, .grain { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
        }
        .print-only { display: none; }
      `}</style>
    </div>
  )
}
