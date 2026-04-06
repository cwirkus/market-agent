/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#08090d',
        surface:  '#0e1117',
        surface2: '#141b24',
        border:   '#1c2535',
        border2:  '#243042',
        gain:     '#00c896',
        loss:     '#ff4560',
        amber:    '#f0b429',
        blue:     '#4d9ef9',
        text:     '#dde3ee',
        subtext:  '#7a8999',
        muted:    '#3a4d60',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
