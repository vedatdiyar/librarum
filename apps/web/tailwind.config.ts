import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        lg: "1.5rem"
      },
      screens: {
        "2xl": "1280px"
      }
    },
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
        "surface-elevated": "rgb(var(--surface-elevated) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--border) / <alpha-value>)",
        ring: "rgb(var(--accent) / <alpha-value>)",
        foreground: "rgb(var(--text-primary) / <alpha-value>)",
        "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-hover": "rgb(var(--accent-hover) / <alpha-value>)",
        destructive: "rgb(var(--destructive) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        card: "rgb(var(--surface) / <alpha-value>)",
        popover: "rgb(var(--surface-raised) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--background) / <alpha-value>)"
        },
        secondary: {
          DEFAULT: "rgb(var(--surface-raised) / <alpha-value>)",
          foreground: "rgb(var(--text-primary) / <alpha-value>)"
        },
        muted: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          foreground: "rgb(var(--text-secondary) / <alpha-value>)"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "sans-serif"
        ],
        serif: [
          "\"Playfair Display\"",
          "Georgia",
          "serif"
        ],
        mono: [
          "\"JetBrains Mono\"",
          "ui-monospace",
          "monospace"
        ],
        "serif-display": [
          "\"Playfair Display\"",
          "Georgia",
          "serif"
        ]
      },
      boxShadow: {
        shell: "0 20px 48px rgba(0, 0, 0, 0.22)",
        panel: "0 10px 28px rgba(0, 0, 0, 0.18)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
