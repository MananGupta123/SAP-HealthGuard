/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Industrial dark theme with amber accents
        'hg-bg': '#0a0a0b',
        'hg-surface': '#111113',
        'hg-surface-2': '#1a1a1d',
        'hg-border': '#2a2a2e',
        'hg-text': '#e4e4e7',
        'hg-text-dim': '#71717a',
        'hg-amber': '#f59e0b',
        'hg-amber-dim': '#b45309',
        'hg-red': '#ef4444',
        'hg-green': '#22c55e',
        'hg-blue': '#3b82f6',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
