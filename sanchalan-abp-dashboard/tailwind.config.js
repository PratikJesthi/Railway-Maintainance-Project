/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
        display: ['"Poppins"', '"IBM Plex Sans"', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#FDFBF5',
          100: '#F8F2E3',
          200: '#F0E7CE',
          300: '#E4D6AF',
          400: '#CDB97C',
        },
        ink: {
          900: '#2B2A22',
          700: '#4A4838',
          500: '#7A7460',
          300: '#A9A28A',
        },
        cyan: {
          50: '#EAF7F6',
          100: '#D2EFEC',
          200: '#A6DFDA',
          400: '#3AACA3',
          500: '#1D8F88',
          600: '#0F7A73',
          700: '#0B615C',
          900: '#0A3E3B',
        },
        dept: {
          eng: '#0F7A73',
          trac: '#B9812C',
          snt: '#7C5AA6',
          merged: '#3E8E5B',
          alert: '#BB4430',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(43,42,34,0.06), 0 8px 24px -12px rgba(43,42,34,0.18)',
        panel: '0 12px 40px -16px rgba(43,42,34,0.28)',
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
