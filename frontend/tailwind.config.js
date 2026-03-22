/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest:  { DEFAULT: '#2D6A4F', light: '#52B788', dark: '#1B4332' },
        earth:   { DEFAULT: '#A0522D', light: '#C47A45', dark: '#6B3520' },
        cream:   { DEFAULT: '#F8F9F0', dark: '#EDF0E0' },
        charcoal:{ DEFAULT: '#1A1A1A', soft: '#2C2C2C' },
        alert:   { DEFAULT: '#E63946' },
        warn:    { DEFAULT: '#F4A261' },
        ok:      { DEFAULT: '#52B788' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(45,106,79,0.10)',
        hover: '0 6px 24px rgba(45,106,79,0.18)',
      },
    },
  },
  plugins: [],
}
