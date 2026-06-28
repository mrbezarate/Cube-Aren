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
        arena: {
          dark: "#0a0a0f",
          card: "#12121a",
          border: "#1e1e2e",
        },
        neon: {
          purple: "#7c3aed",
          blue: "#2563eb",
          gold: "#f59e0b",
          green: "#10b981",
          red: "#ef4444",
        },
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)", "sans-serif"],
        space: ["var(--font-space-grotesk)", "sans-serif"],
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #7c3aed, 0 0 10px #7c3aed' },
          '50%': { boxShadow: '0 0 15px #7c3aed, 0 0 30px #7c3aed' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'neon-purple': '0 0 10px rgba(124, 58, 237, 0.5), 0 0 20px rgba(124, 58, 237, 0.2)',
        'neon-blue': '0 0 10px rgba(37, 99, 235, 0.5), 0 0 20px rgba(37, 99, 235, 0.2)',
        'neon-gold': '0 0 10px rgba(245, 158, 11, 0.5), 0 0 20px rgba(245, 158, 11, 0.2)',
      },
    },
  },
  plugins: [],
};
export default config;
