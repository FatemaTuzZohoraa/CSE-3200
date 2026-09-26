/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ruet: {
          pink: '#EC4899',
          lavender: '#A855F7',
          rose: '#F43F5E',
          purple: '#9333EA',
          softPink: '#FCE7F3',
          softLavender: '#F3E8FF',
          darkBg: '#0F0E17',
          lightBg: '#FDF8FA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.35)',
        'glow-lavender': '0 0 20px rgba(168, 85, 247, 0.35)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
