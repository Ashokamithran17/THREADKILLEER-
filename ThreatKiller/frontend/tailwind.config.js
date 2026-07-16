/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Default dark mode
  theme: {
    extend: {
      colors: {
        background: "#030712", // dark grey/black
        surface: "#111827",    // slate 900
        card: "#1f2937",       // slate 800
        border: "#374151",     // slate 700
        textPrimary: "#f9fafb",// slate 50
        textSecondary: "#9ca3af", // slate 400
        accent: {
          blue: "#3b82f6",     // blue 500
          emerald: "#10b981",  // emerald 500
          purple: "#8b5cf6",   // purple 500
        },
        risk: {
          safe: "#10b981",     // green
          medium: "#f59e0b",   // yellow
          high: "#f97316",     // orange
          critical: "#ef4444", // red
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(59, 130, 246, 0.15)',
        glowRed: '0 0 15px rgba(239, 68, 68, 0.25)',
        glowEmerald: '0 0 15px rgba(16, 185, 129, 0.25)',
      }
    },
  },
  plugins: [],
}
