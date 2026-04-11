import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // UroCases palette
        bg:        "#0d0f18",
        surface:   "#161925",
        surface2:  "#1e2235",
        border:    "#272b42",
        text:      "#e6e9f4",
        muted:     "#7880a4",
        primary:   "#6c7fff",
        success:   "#3ecf8e",
        danger:    "#e05c5c",
        warning:   "#f5a623",
        // Aliases for Tailwind utilities
        background: "#0d0f18",
        accent: {
          DEFAULT: "#6c7fff",
          dim: "rgba(108,127,255,0.15)",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["SF Mono", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        "glow-primary": "0 0 20px rgba(108, 127, 255, 0.25)",
        "glow-success": "0 0 20px rgba(62, 207, 142, 0.2)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "fade-in":  "fadeIn .25s ease forwards",
        "slide-up": "slideUp .3s ease forwards",
        shimmer:    "shimmer 1.4s infinite",
        confetti:   "confetti-fall linear forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "confetti-fall": {
          "0%":   { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
