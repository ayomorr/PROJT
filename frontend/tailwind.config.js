/** Tailwind design system for ScrollGuard — calm health-tech aesthetic. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Surface tokens flip for dark mode. surface.DEFAULT stays transparent so
        // the layered gradient on <body> shows through app-level wrappers.
        surface: {
          DEFAULT: 'transparent',
          soft: '#1B222B',
          card: '#222B37',
        },
        // Light "ink" — text is now light-on-dark.
        ink: {
          DEFAULT: '#E8EDF2',
          soft: '#A3AEBB',
          faint: '#6E7A87',
        },
        // Periwinkle-violet accent tuned for dark backgrounds. Low shades are
        // dark chips; high shades are light readable text/links.
        brand: {
          50: '#1C1F3D',
          100: '#262B54',
          200: '#313A6B',
          300: '#968FF0',
          400: '#8379E8',
          500: '#7765F0',
          600: '#5C48E0',
          700: '#ACA5F6',
          800: '#C0BBFA',
          900: '#D5D2FC',
        },
        amber: {
          soft: '#FDF3E3',
          DEFAULT: '#F2A93B',
        },
        coral: {
          soft: '#FDEDE8',
          DEFAULT: '#E8735A',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.28)',
        lift: '0 2px 4px rgba(0,0,0,0.40), 0 16px 40px rgba(0,0,0,0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pop': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '70%': { transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(109,90,230,0.4)' },
          '70%': { boxShadow: '0 0 0 16px rgba(109,90,230,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(109,90,230,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        pop: 'pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s infinite',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};