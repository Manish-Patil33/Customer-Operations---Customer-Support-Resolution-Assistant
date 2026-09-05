/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f0ff',
          100: '#e0e1ff',
          200: '#c5c6ff',
          300: '#a09bff',
          400: '#7b6afe',
          500: '#5b3ef8',
          600: '#4e2dee',
          700: '#4221d3',
          800: '#371cab',
          900: '#2f1a89',
          950: '#1d0f56',
        },
        surface: {
          50: '#f8f8f9',
          100: '#f1f1f4',
          200: '#e4e4ea',
          300: '#c9cad5',
          400: '#9fa0b0',
          500: '#72748a',
          600: '#5c5e73',
          700: '#4b4d61',
          800: '#404154',
          900: '#383947',
          950: '#111118',
        },
        dark: {
          bg: '#0a0a12',
          card: '#111119',
          border: '#1e1e2e',
          hover: '#16161f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-dark': 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(91, 62, 248, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(91, 62, 248, 0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(91, 62, 248, 0.2)',
        'glow-md': '0 0 20px rgba(91, 62, 248, 0.3)',
        'glow-lg': '0 0 40px rgba(91, 62, 248, 0.4)',
        'card': '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 0 0 1px rgba(91,62,248,0.2), 0 8px 40px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
