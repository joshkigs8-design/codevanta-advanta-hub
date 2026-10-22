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
          bg: "#0a0e0c",
          surface: "#111815",
          "surface-elevated": "#17221c",
          "surface-card": "#131e18",
          border: "#1f3127",
          "border-subtle": "#16251e",
          forest: {
            DEFAULT: "#0f231a",
            light: "#173427",
            dark: "#0a1711",
            muted: "#13281e",
          },
          gold: {
            DEFAULT: "#d4af37",
            hover: "#e2be4a",
            dim: "#9c8128",
            subtle: "rgba(212, 175, 55, 0.12)",
            border: "rgba(212, 175, 55, 0.28)",
          },
          text: {
            primary: "#f4f7f5",
            secondary: "#9bb0a5",
            muted: "#667d71",
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
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        "gold-glow": "0 0 20px -3px rgba(212, 175, 55, 0.18)",
        "card-subtle": "0 4px 20px -2px rgba(0, 0, 0, 0.4)",
      }
    },
  },
  plugins: [],
};
export default config;
