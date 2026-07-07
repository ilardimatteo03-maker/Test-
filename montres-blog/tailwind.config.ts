import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Palette de la direction artistique "Chrono Guide".
        ink: "#0e0e0f",
        paper: "#f7f4ef",
        gold: "#c9a24b",
        steel: "#8a8f98",
        midnight: "#161e2b",
      },
      fontFamily: {
        // Wirées aux variables next/font (cf. layout.tsx).
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "66ch",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
