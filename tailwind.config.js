/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-app':      '#eef1f8',
        'bg-card':     '#ffffff',
        'accent-blue': '#4f8cff',
        'accent-gold': '#f59e0b',
        'accent-green':'#10b981',
        'accent-red':  '#ef4444',
        'accent-purple':'#8b5cf6',
        'accent-orange':'#f97316',
        'text-main':   '#0f172a',
        'text-sub':    '#475569',
        'text-muted':  '#94a3b8',
        'border-base': '#d1d5db',
        'border-light':'#e5e7eb',
      },
      fontFamily: {
        display: ['"Bungee"', 'cursive'],
        body: ['"Quicksand"', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)',
        'card-lg':'0 4px 8px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.12)',
        blue:   '0 4px 14px rgba(79,140,255,0.40)',
        gold:   '0 4px 14px rgba(245,158,11,0.40)',
        red:    '0 4px 14px rgba(239,68,68,0.35)',
        green:  '0 4px 14px rgba(16,185,129,0.35)',
      },
    },
  },
  plugins: [],
}
