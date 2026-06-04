import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  const starsRef = useRef(null)

  // Pixel-stjernefelt — popper opp og blinker, fjernes når animasjonen er ferdig.
  useEffect(() => {
    const layer = starsRef.current
    if (!layer) return
    const palettes = [
      { c1: '#d6eaff', c2: '#5aa0ff', c3: '#2b5fd0' },
      { c1: '#e6f2ff', c2: '#7ab8ff', c3: '#3f7ad0' },
      { c1: '#e3d4ff', c2: '#b07ae8', c3: '#6a3fb0' },
      { c1: '#ffd9f2', c2: '#e87ad6', c3: '#b0468f' },
    ]
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function spawn() {
      if (!layer || layer.childElementCount > 30) return
      const s = document.createElement('span')
      s.className = 'pstar'
      const pal = palettes[(Math.random() * palettes.length) | 0]
      const p = (2 + Math.random() * 3.5).toFixed(1)
      s.style.setProperty('--p', p + 'px')
      s.style.setProperty('--c1', pal.c1)
      s.style.setProperty('--c2', pal.c2)
      s.style.setProperty('--c3', pal.c3)
      s.style.left = Math.random() * 98 + 'vw'
      s.style.top = Math.random() * 96 + 'vh'
      s.style.animationDuration = (2 + Math.random() * 2.8).toFixed(2) + 's'
      layer.appendChild(s)
      s.addEventListener('animationend', () => s.remove())
    }

    let timers = []
    let interval
    if (!reduce) {
      for (let i = 0; i < 14; i++) timers.push(setTimeout(spawn, i * 120))
      interval = setInterval(spawn, 380)
    } else {
      for (let i = 0; i < 10; i++) spawn()
    }
    return () => {
      timers.forEach(clearTimeout)
      if (interval) clearInterval(interval)
      if (layer) layer.innerHTML = ''
    }
  }, [])

  return (
    <>
      <div className="stars" aria-hidden="true" ref={starsRef} />

      <main
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 30,
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            letterSpacing: '0.24em',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: 'var(--color-star)' }}>✦</span> Digitabel · Digital veileder
        </span>

        {/* Abel-maskot */}
        <div
          style={{
            width: 84,
            height: 84,
            border: '2px solid var(--color-border)',
            borderRadius: 5,
            background: '#e8e8e8',
            overflow: 'hidden',
            boxShadow: '4px 4px 0 rgba(176,122,232,.55)',
          }}
        >
          <img
            src="/abel-avatar.png"
            alt="Abel"
            draggable="false"
            className="sprite-img character-idle"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              imageRendering: 'pixelated',
              display: 'block',
              transformOrigin: 'bottom center',
            }}
          />
        </div>

        {/* Hero */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <h1
            className="display-title"
            style={{ fontSize: 'clamp(30px,7vw,58px)', lineHeight: 1.02, margin: 0 }}
          >
            <span style={{ display: 'block' }}>Velkommen til</span>
            <span className="glitch" data-text="DIGITABEL" style={{ display: 'block' }}>
              DIGITABEL
            </span>
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--color-text-muted)',
              maxWidth: 340,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            Snakk med Digitabel, forbered deg til veiledningen med Abel, og hold oversikt. Alt på ett sted.
          </p>
        </div>

        {/* Rollevalg */}
        <nav className="roles">
          <button
            type="button"
            className="role student"
            onClick={() => navigate('/student')}
          >
            <span className="badge">01</span>
            <span className="name" data-text="Student">Student</span>
            <p className="desc">Ta en runde med Digitabel før du møter Abel til veiledning.</p>
            <span className="go">Fortsett <span className="arrow">→</span></span>
          </button>
          <button
            type="button"
            className="role fagleder"
            onClick={() => navigate('/project')}
          >
            <span className="badge">02</span>
            <span className="name" data-text="Planlegging">Planlegging</span>
            <p className="desc">Lag en realistisk milepælplan for prosjektet ditt.</p>
            <span className="go">Fortsett <span className="arrow">→</span></span>
          </button>
        </nav>

        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)',
            opacity: 0.7,
            textTransform: 'uppercase',
          }}
        >
          Velg hvem du er for å logge inn
        </span>
      </main>

      <div className="grain" aria-hidden="true" />

      <style>{`
        .roles {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          width: 100%;
          max-width: 520px;
        }
        @media (max-width: 460px) {
          .roles { grid-template-columns: 1fr; max-width: 360px; }
        }
        .role {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
          background: var(--color-surface);
          border: 2px solid var(--color-text);
          padding: 20px 18px 18px;
          position: relative;
          cursor: pointer;
          color: var(--color-text);
          box-shadow: -3px 0 0 var(--color-chroma-pink), 3px 0 0 var(--color-chroma-blue), 5px 7px 0 rgba(0,0,0,.5);
          transition: transform .12s steps(2), box-shadow .12s steps(2), border-color .12s ease;
        }
        .role::after {
          content: '✦';
          position: absolute;
          top: 12px;
          right: 14px;
          font-size: 11px;
          color: var(--color-text-muted);
          opacity: .55;
        }
        .role .badge {
          font-family: var(--font-pixel);
          font-size: 9px;
          color: var(--color-text-muted);
          letter-spacing: .04em;
        }
        .role .name {
          position: relative;
          display: inline-block;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 28px;
          text-transform: uppercase;
          color: var(--color-text);
          line-height: 1;
          letter-spacing: -.01em;
        }
        .role .name::before, .role .name::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          pointer-events: none;
          opacity: 0;
        }
        .role .name::before { color: var(--color-chroma-pink); opacity: .28; transform: translateX(-1.5px); }
        .role .name::after  { color: var(--color-chroma-blue); opacity: .28; transform: translateX(1.5px); }
        .role:hover .name::before { opacity: .9; animation: gx-a .26s steps(2,end) infinite; }
        .role:hover .name::after  { opacity: .9; animation: gx-b .26s steps(2,end) infinite; }
        .role:hover .name { animation: gx-main .26s steps(2,end) infinite; }
        @keyframes gx-main { 0%,100%{transform:translateX(0);}30%{transform:translateX(-2px);}60%{transform:translateX(2px);} }
        @keyframes gx-a { 0%,100%{transform:translate(-1.5px,0);}25%{transform:translate(-6px,-1px);}50%{transform:translate(3px,1px);}75%{transform:translate(-4px,0);} }
        @keyframes gx-b { 0%,100%{transform:translate(1.5px,0);}25%{transform:translate(6px,1px);}50%{transform:translate(-3px,-1px);}75%{transform:translate(4px,0);} }
        .role .desc {
          font-family: var(--font-body);
          font-size: 11.5px;
          line-height: 1.5;
          color: var(--color-text-muted);
          margin: 0;
        }
        .role .go {
          margin-top: 4px;
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 10.5px;
          letter-spacing: .12em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .role .go .arrow { transition: transform .15s steps(2); }
        .role:hover { transform: translate(-1px,-2px); }
        .role:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 rgba(0,0,0,.7); }
        .role:hover .go .arrow { transform: translateX(4px); }
        .role:hover { animation: frame-glitch .28s steps(2,end) infinite; }
        @keyframes frame-glitch {
          0%,100% { box-shadow: -3px 0 0 var(--color-chroma-pink), 3px 0 0 var(--color-chroma-blue), 5px 7px 0 rgba(0,0,0,.5); }
          33% { box-shadow: -7px -2px 0 var(--color-chroma-pink), 7px 2px 0 var(--color-chroma-blue), 5px 7px 0 rgba(0,0,0,.5); }
          66% { box-shadow: -5px 2px 0 var(--color-chroma-pink), 5px -2px 0 var(--color-chroma-blue), 5px 7px 0 rgba(0,0,0,.5); }
        }
        .role.student .go { color: var(--color-chroma-pink); }
        .role.fagleder .go { color: var(--color-chroma-blue); }
      `}</style>
    </>
  )
}
