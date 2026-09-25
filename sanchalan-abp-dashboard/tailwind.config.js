/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', '"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
        display: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
      },
      colors: {
        railway: {
          950: '#050B16', // Near-black navy canvas
          900: '#0B1424', // Secondary background
          800: '#101B2D', // Panel background
          700: '#142238', // Elevated panel
          border: '#26364D', // Borders
          cyan: '#06B6D4',   // Signal Teal/Cyan primary accent
        },
        slate: {
          950: '#050B16',
          900: '#0B1424',
          800: '#101B2D',
          700: '#142238',
          600: '#26364D',
          500: '#475569',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        dept: {
          eng: '#06B6D4',     // Engineering P.Way cyan/teal
          trac: '#F59E0B',    // Traction OHE amber/orange
          snt: '#8B5CF6',     // Signal & Telecom violet
          merged: '#3B82F6',  // Combined Block blue
          alert: '#EF4444',   // Conflict / critical red
          success: '#10B981', // Success green
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.3)',
        panel: '0 10px 25px rgba(0,0,0,0.4)',
        flyout: '0 10px 25px rgba(0,0,0,0.5)',
        glow: '0 0 12px rgba(6, 182, 212, 0.3)',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
    },
  },
  plugins: [],
};

