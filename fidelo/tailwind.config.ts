import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette premium : noir / blanc / violet
        // Aligné sur la DA ASM. — noir / blanc / bleu électrique
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#111111",
        },
        // Bleu-nuit des sections sombres ASM (navy solide premium)
        night: {
          DEFAULT: "#0B1120",
          deep: "#080C17",
        },
        // Bleu électrique ASM (accent, boutons, chiffres)
        brand: {
          50: "#EEF4FF",
          100: "#DBE6FF",
          200: "#BFD3FF",
          300: "#93B4FF",
          400: "#6E9BFF",
          500: "#2F6BFF",
          600: "#1E56E8",
          700: "#1A47C2",
          800: "#17399B",
          900: "#16337F",
        },
      },
      fontFamily: {
        // DA ASM : Geist, grotesque neutre premium
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      // Ombres ambiantes très diffuses (soft-skill : « floating components »)
      boxShadow: {
        soft: "0 1px 2px rgba(11,17,32,0.04), 0 4px 12px -6px rgba(11,17,32,0.08)",
        card: "0 2px 6px -2px rgba(11,17,32,0.06), 0 12px 32px -12px rgba(11,17,32,0.12)",
        float: "0 8px 24px -12px rgba(11,17,32,0.12), 0 30px 60px -30px rgba(11,17,32,0.20)",
        glow: "0 8px 30px -8px rgba(47,107,255,0.35)",
        inset: "inset 0 1px 1px rgba(255,255,255,0.6)",
      },
      transitionTimingFunction: {
        // Ressort premium (soft-skill)
        spring: "cubic-bezier(0.32,0.72,0,1)",
        smooth: "cubic-bezier(0.22,1,0.36,1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "pop": "pop 0.4s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
