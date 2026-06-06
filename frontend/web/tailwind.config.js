/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand colors (logo)
        brand: {
          green: "#39A935",
          blue: "#1F66D1",
          red: "#FF4040",
          yellow: "#F4B400",
          white: "#FFFFFF",
          "green-light": "#EAF7E8",
          "blue-light": "#EAF2FD",
          "red-light": "#FFE9E9",
          "yellow-light": "#FFF4D6",
        },
        // Neutral grays for surfaces
        ink: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        // Semantic aliases
        primary: {
          DEFAULT: "#39A935",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1F66D1",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#FF4040",
          foreground: "#FFFFFF",
        },
        community: {
          DEFAULT: "#F4B400",
          foreground: "#1E293B",
        },
        background: "#FFFFFF",
        foreground: "#0F172A",
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#1F66D1",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        card: "0 4px 14px rgba(15, 23, 42, 0.06)",
        lift: "0 10px 30px rgba(15, 23, 42, 0.08)",
        glow: "0 0 0 4px rgba(31, 102, 209, 0.18)",
        "glow-green": "0 0 0 4px rgba(57, 169, 53, 0.20)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-fade-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.6" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 220ms ease-out",
        "scale-fade-in": "scale-fade-in 220ms ease-out",
        "slide-in-right": "slide-in-right 240ms ease-out",
        shimmer: "shimmer 1.5s linear infinite",
        ripple: "ripple 600ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
