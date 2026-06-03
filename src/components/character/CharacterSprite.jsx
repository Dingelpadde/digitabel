/**
 * CharacterSprite — den ekte pixel-Abel som innrammet portrett.
 * Props:
 *   pose: 'idle' | 'talking' | 'thinking' | 'serious'
 *   size: 'sm' | 'md' | 'lg'
 *   animated: boolean (default true)
 */

const SIZE = {
  sm: 38,
  md: 84,
  lg: 100,
}

export default function CharacterSprite({ pose = 'idle', size = 'md', animated = true }) {
  const px = SIZE[size] ?? SIZE.md
  const animClass = animated ? `character-${pose}` : ''
  const serious = pose === 'serious'

  return (
    <div
      style={{
        width: px,
        height: px,
        flexShrink: 0,
        border: `2px solid ${serious ? 'var(--color-text-muted)' : 'var(--color-border)'}`,
        borderRadius: size === 'sm' ? 4 : 5,
        background: '#e8e8e8',
        overflow: 'hidden',
        boxShadow: `${size === 'sm' ? '2px 2px' : '4px 4px'} 0 rgba(176,122,232,.55)`,
      }}
      aria-hidden="true"
      data-pose={pose}
    >
      <img
        src="/abel-avatar.png"
        alt="Abel"
        draggable="false"
        className={`sprite-img ${animClass}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'pixelated',
          display: 'block',
          transformOrigin: 'bottom center',
          transform: 'scale(1.04)',
          userSelect: 'none',
        }}
      />
    </div>
  )
}
