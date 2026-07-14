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
        // Bleu-nuit des sections sombres ASM
        night: {
          DEFAULT: "#0D1526",
          deep: "#070A12",
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
        // DA ASM : grotesque neutre, gras et serré (Inter en poids lourds)
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,16,24,0.04), 0 8px 24px rgba(16,16,24,0.06)",
        card: "0 1px 3px rgba(16,16,24,0.06), 0 12px 40px rgba(16,16,24,0.08)",
        glow: "0 10px 34px rgba(47,107,255,0.38)",
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
