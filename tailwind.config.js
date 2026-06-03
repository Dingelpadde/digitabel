/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:           '#0c060f',
        surface:      '#150a1a',
        'surface-alt':'#221229',
        border:       '#3a2045',
        accent:       '#e87ab0',
        'accent-dark':'#b8508a',
        text:         '#ecdef0',
        'text-muted': '#7e6090',
        'text-inv':   '#1a0f1e',
        'bubble-out': '#f0e6ee',
        'bubble-in':  '#221229',
        // Kromatiske aksenter — kun på titler/viktige elementer
        'chroma-pink':'#e87ad6',
        'chroma-blue':'#b07ae8',
        // Beholdt under gamle navn så eksisterende komponenter re-skinnes
        frame:        '#e87ad6',
        'frame-dark': '#b8508a',
        star:         '#e87ad6',
        dashed:       '#4a2a5a',
        success:      '#6ab04c',
        warning:      '#e8a030',
        danger:       '#e85050',
        info:         '#b07ae8',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        pixel:   ['"Press Start 2P"', 'monospace'],
        body:    ['"Space Mono"', '"Courier New"', 'monospace'],
        mono:    ['"Space Mono"', '"Courier New"', 'monospace'],
      },
      fontSize: {
        'pixel-xs': '7px',
        'pixel-sm': '9px',
        'pixel-md': '11px',
        'pixel-lg': '14px',
      },
      boxShadow: {
        pixel:     '3px 3px 0 rgba(0,0,0,0.8)',
        'pixel-sm':'2px 2px 0 rgba(0,0,0,0.8)',
        card:      '4px 4px 0 rgba(0,0,0,0.7)',
        frame:     '4px 4px 0 #b8508a',
        glow:      '0 0 0 3px rgba(232,122,214,0.14)',
      },
    },
  },
  plugins: [],
}
