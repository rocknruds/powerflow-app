import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-funnel)", "sans-serif"],
        serif: ["var(--font-family-serif)"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
        },
        border: "var(--border)",
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        score: {
          pf: "var(--score-pf)",
          authority: "var(--score-authority)",
          reach: "var(--score-reach)",
          high: "var(--score-high)",
          mid: "var(--score-mid)",
          low: "var(--score-low)",
        },
        delta: {
          up: "var(--delta-up)",
          down: "var(--delta-down)",
          neutral: "var(--delta-neutral)",
        },
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
  plugins: [],
};

export default config;