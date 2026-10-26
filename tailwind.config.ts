import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        hub: {
          bg: "#080a0f",
          surface: "#11151d",
          "surface-elevated": "#1a202b",
          "surface-card": "#131923",
          border: "#293240",
          "border-subtle": "#202936",
          forest: {
            DEFAULT: "#17251e",
            light: "#263c2b",
            dark: "#0b120e",
            muted: "#17231d",
          },
          gold: {
            DEFAULT: "#c9003d",
            hover: "#ef174e",
            dim: "#7d0a2c",
            subtle: "rgba(201, 0, 61, 0.14)",
            border: "rgba(239, 23, 78, 0.34)",
          },
          text: {
            primary: "#f5f7f2",
            secondary: "#a2adbd",
            muted: "#687384",
          },
          status: {
            verified: "#10b981",
            pending: "#f59e0b",
            stale: "#ef4444",
            info: "#3b82f6",
          }
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      boxShadow: {
          "gold-glow": "0 0 28px -5px rgba(201, 0, 61, 0.34)",
        "card-subtle": "0 4px 20px -2px rgba(0, 0, 0, 0.4)",
      }
    },
  },
  plugins: [],
};
export default config;
