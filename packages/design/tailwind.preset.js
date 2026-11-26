// Preset de Tailwind con la identidad de MiConjunto.
// Uso en tailwind.config.js:  presets: [require('./tailwind.preset.js')]
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#39A935', 'green-700': '#1F7C3A', 'green-light': '#EAF7E8',
          blue: '#1F66D1', 'blue-light': '#EAF2FD',
          red: '#FF4040', 'red-700': '#D92B2B', 'red-light': '#FFE9E9',
          yellow: '#F4B400', 'yellow-800': '#8A6300', 'yellow-light': '#FFF4D6',
          navy: '#01234C', white: '#FFFFFF',
        },
        ink: {
          50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8',
          500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A',
        },
        primary: { DEFAULT: '#1F7C3A', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#1F66D1', foreground: '#FFFFFF' },
        destructive: { DEFAULT: '#D92B2B', foreground: '#FFFFFF' },
        community: { DEFAULT: '#F4B400', foreground: '#1E293B' },
        background: '#FFFFFF',
        foreground: '#0F172A',
        muted: { DEFAULT: '#F1F5F9', foreground: '#64748B' },
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#1F66D1',
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem', '3xl': '1.5rem' },
      boxShadow: {
        soft: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        card: '0 4px 14px rgba(15, 23, 42, 0.06)',
        lift: '0 10px 30px rgba(15, 23, 42, 0.08)',
        glow: '0 0 0 4px rgba(31, 102, 209, 0.18)',
        'glow-green': '0 0 0 4px rgba(57, 169, 53, 0.20)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-fade-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'slide-in-right': { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out',
        'scale-fade-in': 'scale-fade-in 220ms ease-out',
        'slide-in-right': 'slide-in-right 240ms ease-out',
        shimmer: 'shimmer 1.5s linear infinite',
      },
    },
  },
}
