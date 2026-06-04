export default function MilestoneTimeline({ plan }) {
  const { intro, milestones = [], tips } = plan

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T12:00:00')
      const day = String(d.getDate()).padStart(2, '0')
      const months = ['JAN','FEB','MAR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DES']
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`
    } catch { return dateStr }
  }

  return (
    <div className="ms-root">
      {intro && <p className="ms-intro">{intro}</p>}

      <div className="ms-track">
        {milestones.map((m, i) => {
          const isLast = i === milestones.length - 1
          return (
            <div key={i} className={`ms-item${isLast ? ' ms-last' : ''}`}>
              <div className="ms-marker">
                <span className="ms-star">✦</span>
              </div>
              <div className="ms-content">
                <time className="ms-date">{formatDate(m.date)}</time>
                <span className="ms-title" data-text={m.title}>{m.title}</span>
                {m.description && <p className="ms-desc">{m.description}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {tips && (
        <div className="ms-tips">
          <p className="pixel-label" style={{ marginBottom: 10 }}>Tips</p>
          <p className="ms-tips-text">{tips}</p>
        </div>
      )}

      <style>{`
        .ms-root { width: 100%; }

        .ms-intro {
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.7;
          color: var(--color-text-muted);
          margin: 0 0 32px;
        }

        .ms-track {
          position: relative;
          padding-left: 40px;
        }
        .ms-track::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 10px;
          bottom: 10px;
          border-left: 2px dashed var(--color-dashed);
        }

        .ms-item {
          position: relative;
          padding-bottom: 32px;
        }
        .ms-item.ms-last { padding-bottom: 0; }

        .ms-marker {
          position: absolute;
          left: -40px;
          top: 0;
          width: 16px;
          display: flex;
          justify-content: center;
        }
        .ms-star {
          font-size: 14px;
          color: var(--color-star);
          line-height: 1;
          display: block;
        }
        .ms-item.ms-last .ms-star {
          color: var(--color-chroma-pink);
          font-size: 16px;
          filter: drop-shadow(0 0 5px var(--color-chroma-pink));
        }

        .ms-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }
        .ms-date {
          display: block;
          font-family: var(--font-body);
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }
        .ms-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 16px;
          color: var(--color-text);
          line-height: 1.2;
          position: relative;
          display: inline-block;
          word-break: break-word;
        }
        .ms-title::before,
        .ms-title::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          pointer-events: none;
          opacity: 0;
        }
        .ms-title::before { color: var(--color-chroma-pink); transform: translateX(-1.5px); }
        .ms-title::after  { color: var(--color-chroma-blue); transform: translateX(1.5px); }
        .ms-item:hover .ms-title::before { opacity: .9; animation: ms-a .26s steps(2,end) infinite; }
        .ms-item:hover .ms-title::after  { opacity: .9; animation: ms-b .26s steps(2,end) infinite; }
        .ms-item:hover .ms-title { animation: ms-main .26s steps(2,end) infinite; }
        @keyframes ms-main { 0%,100%{transform:translateX(0);}30%{transform:translateX(-2px);}60%{transform:translateX(2px);} }
        @keyframes ms-a { 0%,100%{transform:translate(-1.5px,0);}25%{transform:translate(-6px,-1px);}50%{transform:translate(3px,1px);}75%{transform:translate(-4px,0);} }
        @keyframes ms-b { 0%,100%{transform:translate(1.5px,0);}25%{transform:translate(6px,1px);}50%{transform:translate(-3px,-1px);}75%{transform:translate(4px,0);} }

        .ms-desc {
          font-family: var(--font-body);
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-muted);
          margin: 0;
          word-break: break-word;
        }

        .ms-tips {
          margin-top: 32px;
          padding: 16px 18px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-left: 3px solid var(--color-chroma-pink);
        }
        .ms-tips-text {
          font-family: var(--font-body);
          font-size: 12px;
          line-height: 1.75;
          color: var(--color-text-muted);
          margin: 0;
          white-space: pre-line;
        }

        /* ── Print ── */
        @media print {
          .ms-intro  { color: #444; }
          .ms-track::before { border-color: #bbb; }
          .ms-star   { color: #333 !important; filter: none !important; }
          .ms-date   { color: #666; }
          .ms-title  { color: #000 !important; }
          .ms-item:hover .ms-title,
          .ms-item:hover .ms-title::before,
          .ms-item:hover .ms-title::after { animation: none !important; opacity: 0; }
          .ms-desc   { color: #555; }
          .ms-tips   { border-color: #bbb; border-left-color: #444; background: #f7f7f7; }
          .ms-tips-text { color: #444; }
        }
      `}</style>
    </div>
  )
}
