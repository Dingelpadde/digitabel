const CONFIG = {
  not_started: {
    color: '#7e6090',
    label: 'Ikke startet',
  },
  in_progress: {
    color: '#e8a030',
    label: 'Pågår',
  },
  cleared: {
    color: '#6ab04c',
    label: 'Cleared',
  },
}

export default function StatusBadge({ status, compact = false }) {
  const cfg = CONFIG[status] || CONFIG.not_started

  if (compact) {
    return (
      <span
        title={cfg.label}
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          background: cfg.color,
          boxShadow: '1px 1px 0 #000',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: `${cfg.color}18`,
        border: `2px solid ${cfg.color}`,
        boxShadow: '2px 2px 0 #000',
        padding: '3px 8px',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 6,
        color: cfg.color,
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          background: cfg.color,
          boxShadow: '1px 1px 0 #000',
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  )
}
