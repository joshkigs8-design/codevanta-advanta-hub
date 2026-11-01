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
          base: "#06080c",
          bg: "#080a0f",
          surface: "#10141d",
          "surface-elevated": "#171d29",
          "surface-card": "#121722",
          border: "#242d3d",
          "border-subtle": "rgba(255, 255, 255, 0.08)",
          forest: {
            DEFAULT: "#17251e",
            light: "#263c2b",
            dark: "#0b120e",
            muted: "#17231d",
          },
          // True Metallic Gold Scale (Value, Subscriptions, KES Balances, Badges)
          gold: {
            DEFAULT: "#e5c158",
            hover: "#f5d77f",
            dim: "#b8902d",
            subtle: "rgba(229, 193, 88, 0.12)",
            border: "rgba(229, 193, 88, 0.35)",
            metallic: "#d4af37",
          },
          // Architectural Signature Ruby (Logo emblem & critical alerts)
          ruby: {
            DEFAULT: "#c9003d",
            hover: "#ff2a5f",
            dim: "#7a0024",
            subtle: "rgba(201, 0, 61, 0.14)",
            border: "rgba(255, 42, 95, 0.35)",
          },
          text: {
            primary: "#f8fafc",
            secondary: "#94a3b8",
            muted: "#64748b",
          },
          status: {
            verified: "#10b981",
            pending: "#f59e0b",
            stale: "#ef4444",
            info: "#3b82f6",
          },
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      boxShadow: {
        "gold-glow": "0 0 28px -5px rgba(229, 193, 88, 0.35)",
        "ruby-glow": "0 0 28px -5px rgba(201, 0, 61, 0.35)",
        "card-subtle": "0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        "card-hover": "0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px -5px rgba(229, 193, 88, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
