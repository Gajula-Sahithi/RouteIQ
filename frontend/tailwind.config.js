/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        surface: "var(--color-surface)",
        card: "var(--color-card)",
        accent: "var(--color-accent)",
        teal: "var(--color-teal)",
        violet: "var(--color-violet)",
        danger: "var(--color-danger)",
        warn: "var(--color-warn)",
        safe: "var(--color-safe)",
        "text-primary": "var(--color-text-primary)",
        "text-muted": "var(--color-text-muted)",
        border: "var(--color-border)",
        "border-muted": "var(--color-border-muted)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        data: ["var(--font-data)", "monospace"],
        body: ["var(--font-body)", "sans-serif"],
        micro: ["var(--font-micro)", "sans-serif"],
      },
      boxShadow: {
        clay: "var(--clay-shadow)",
      },
    },
  },
  plugins: [],
}
