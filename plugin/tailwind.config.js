/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}", "./src/ui.html"],
  theme: {
    extend: {
      colors: {
        propper: {
          50: "#f0f9ff",
          100: "#f8fafc",
          200: "#e2e8f0",
          300: "#cad5e2",
          400: "#62748e",
          500: "#0ea5e9",
          600: "#18a0fb",
          700: "#0f172b",
          800: "#0369a1",
          900: "#0f172b",
        },
        severity: {
          critical: "#dc2626",
          "critical-bg": "#fef2f2",
          "critical-border": "#fecaca",
          warning: "#d97706",
          "warning-bg": "#fffbeb",
          "warning-border": "#fde68a",
          info: "#2563eb",
          "info-bg": "#eff6ff",
          "info-border": "#bfdbfe",
          success: "#16a34a",
          "success-bg": "#f0fdf4",
          "success-border": "#bbf7d0",
        },
      },
      fontFamily: {
        display: ['"Jaro"', "sans-serif"],
        body: ['"Inter"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px black",
        "brutal-sm": "2px 2px 0px 0px black",
        "brutal-lg": "8px 8px 0px 0px black",
        "brutal-blue": "4px 4px 0px 0px #18a0fb",
        "brutal-gray": "4px 4px 0px 0px #7d7d7d",
        soft: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.1)",
      },
      borderWidth: {
        3: "3px",
      },
      animation: {
        "spin-slow": "spin 2s linear infinite",
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "score-fill": "score-fill 1s ease-out forwards",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "score-fill": {
          from: { strokeDashoffset: "251.2" },
        },
      },
    },
  },
  plugins: [],
};
