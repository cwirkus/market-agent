/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#060609',
        surface:  '#0d1117',
        surface2: '#111827',
        border:   '#1e2433',
        border2:  '#252d3d',
        gain:     '#10b981',
        loss:     '#f43f5e',
        accent:   '#6366f1',
        accent2:  '#818cf8',
        muted:    '#475569',
        text:     '#e2e8f0',
        subtext:  '#94a3b8',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
