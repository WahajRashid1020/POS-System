import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        // Dark theme palette (matching your screenshot)
        dark: {
          bg: "#0f1221",
          card: "#171b2e",
          surface: "#1e2338",
          border: "#2a2f45",
          hover: "#252a40",
          input: "#1a1f33",
          accent: "#3b5bdb",
          "accent-hover": "#4c6ef5",
        },
        surface: {
          DEFAULT: "#fafaf9",
          secondary: "#f5f5f4",
          tertiary: "#e7e5e4",
        },
        ink: {
          DEFAULT: "#1c1917",
          secondary: "#57534e",
          tertiary: "#a8a29e",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
