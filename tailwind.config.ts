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
    },
  },
  plugins: [],
};

export default config;
