/**
 * CharacterSprite — placeholder til pixelart-karakteren er ferdigdesignet.
 * Props:
 *   pose: 'idle' | 'talking' | 'thinking' | 'serious'
 *   size: 'sm' | 'md' | 'lg'
 *   animated: boolean (default true)
 */

const SIZE = {
  sm: { outer: 56,  inner: 36, pixel: 'pixel-xs' },
  md: { outer: 80,  inner: 52, pixel: 'pixel-sm' },
  lg: { outer: 100, inner: 64, pixel: 'pixel-md' },
}

const POSE_LABEL = {
  idle:     '...',
  talking:  '..!',
  thinking: '?',
  serious:  '.',
}

const POSE_COLOR = {
  idle:     '#e8b87a',
  talking:  '#6ab04c',
  thinking: '#4a90d9',
  serious:  '#7a8a9a',
}

export default function CharacterSprite({ pose = 'idle', size = 'md', animated = true }) {
  const s = SIZE[size] ?? SIZE.md
  const animClass = animated ? `character-${pose}` : ''
  const color = POSE_COLOR[pose]

  return (
    <div
      className={`flex flex-col items-center gap-1 select-none ${animClass}`}
      style={{ width: s.outer }}
      aria-hidden="true"
      data-pose={pose}
    >
      {/* Avatar-boks */}
      <div
        style={{
          width: s.outer,
          height: s.outer,
          background: '#1f2d3d',
          border: `2px solid ${color}`,
          boxShadow: `3px 3px 0 #1a0e04`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Piksel-avatar: store "A" bokstav som stand-in */}
        <span
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: s.inner * 0.55,
            color,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          A
        </span>

        {/* Status-prikk øverst til høyre */}
        {pose === 'talking' && (
          <span
            style={{
              position: 'absolute',
              top: 3,
              right: 3,
              width: 6,
              height: 6,
              background: '#6ab04c',
              boxShadow: '1px 1px 0 #000',
            }}
          />
        )}
        {pose === 'thinking' && (
          <span
            style={{
              position: 'absolute',
              top: 3,
              right: 3,
              width: 6,
              height: 6,
              background: '#4a90d9',
              boxShadow: '1px 1px 0 #000',
            }}
          />
        )}
      </div>

      {/* Pose-label */}
      <span
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 6,
          color: '#7a8a9a',
          letterSpacing: '0.05em',
        }}
      >
        {POSE_LABEL[pose]}
      </span>
    </div>
  )
}
