/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fall: {
          50: '#FAF6F0',
          100: '#F3E8DB',
          200: '#E5CEB4',
          300: '#D6AF8B',
          400: '#C58B5C',
          500: '#C85A32',
          600: '#B24520',
          700: '#8F3115',
          800: '#672210',
          900: '#3D1409',
          950: '#230B05',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        terracotta: {
          DEFAULT: '#C85A32',
          light: '#E06D43',
          dark: '#9E3C1B',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'fall-gradient': 'linear-gradient(135deg, #3D1409 0%, #8F3115 50%, #C85A32 100%)',
        'fall-hero': 'linear-gradient(135deg, #230B05 0%, #451A03 40%, #8F3115 80%, #C85A32 100%)',
        'fall-card': 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 246, 240, 0.9) 100%)',
        'autumn-glow': 'radial-gradient(circle at 50% 0%, rgba(200, 90, 50, 0.15), transparent 70%)',
      },
      boxShadow: {
        'fall-sm': '0 2px 8px -2px rgba(61, 20, 9, 0.08), 0 1px 4px -1px rgba(200, 90, 50, 0.04)',
        'fall-md': '0 8px 24px -4px rgba(61, 20, 9, 0.12), 0 4px 12px -2px rgba(200, 90, 50, 0.08)',
        'fall-lg': '0 16px 36px -6px rgba(61, 20, 9, 0.18), 0 8px 20px -4px rgba(200, 90, 50, 0.12)',
        'fall-glow': '0 0 25px rgba(200, 90, 50, 0.25)',
      }
    },
  },
  plugins: [],
}
