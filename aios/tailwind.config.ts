import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

// All colors resolve from CSS variables defined in src/index.css (:root / .dark).
// To re-theme, edit those variables — not this file. (Ported from harbormill-aios.)
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Inter var", "Inter", ...defaultTheme.fontFamily.sans],
        mono: [...defaultTheme.fontFamily.mono],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          DEFAULT: "hsl(var(--primary))",
          accent: "hsl(var(--secondary))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.03)", opacity: "0.95" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        breathe: "breathe 3s ease-in-out infinite",
      },
      boxShadow: {
        glow: "0 0 24px hsl(var(--primary) / 0.18), 0 0 60px hsl(var(--primary) / 0.06)",
        "card-sm": "var(--shadow-sm)",
        "card-md": "var(--shadow-md)",
        "card-lg": "var(--shadow-lg)",
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
} satisfies Config;
