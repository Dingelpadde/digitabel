/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:           '#16213e',
        surface:      '#1f2d3d',
        'surface-alt':'#263547',
        border:       '#2a3f55',
        accent:       '#e8b87a',
        'accent-dark':'#c49050',
        text:         '#e8e0d0',
        'text-muted': '#7a8a9a',
        'text-inv':   '#1a1a2e',
        'bubble-out': '#f5efe6',
        'bubble-in':  '#2a3f55',
        frame:        '#c8a060',
        'frame-dark': '#8a6030',
        success:      '#6ab04c',
        warning:      '#f0a500',
        danger:       '#e74c3c',
        info:         '#4a90d9',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        body:  ['Inter', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'pixel-xs': '7px',
        'pixel-sm': '9px',
        'pixel-md': '11px',
        'pixel-lg': '14px',
      },
      boxShadow: {
        pixel:     '3px 3px 0 #000',
        'pixel-sm':'2px 2px 0 #000',
        card:      '4px 4px 0 rgba(0,0,0,0.4)',
        frame:     '4px 4px 0 #8a6030',
        glow:      '0 0 0 3px rgba(232,184,122,0.15)',
      },
    },
  },
  plugins: [],
}
