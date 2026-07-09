import type { Config } from "tailwindcss";

const withOpacity = (variableName: string): any => {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium dark palette mapped to dynamic CSS variables
        bg: {
          primary: withOpacity('--bg-primary-rgb'),
          secondary: withOpacity('--bg-secondary-rgb'),
          tertiary: withOpacity('--bg-tertiary-rgb'),
          elevated: withOpacity('--bg-elevated-rgb'),
        },
        text: {
          primary: withOpacity('--text-primary-rgb'),
          secondary: withOpacity('--text-secondary-rgb'),
          tertiary: withOpacity('--text-tertiary-rgb'),
          muted: withOpacity('--text-muted-rgb'),
        },
        accent: {
          primary: withOpacity('--accent-primary-rgb'),
          'primary-hover': withOpacity('--accent-primary-hover-rgb'),
          secondary: withOpacity('--accent-secondary-rgb'),
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
        border: {
          subtle: 'var(--border-subtle)',
          default: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        // Legacy aliases (for compatibility)
        arena: {
          dark: withOpacity('--bg-primary-rgb'),
          card: withOpacity('--bg-secondary-rgb'),
          border: 'var(--border-default)',
        },
        // Dynamic Neon mappings to support active color accents
        'neon-purple': withOpacity('--accent-primary-rgb'),
        'neon-blue': withOpacity('--accent-secondary-rgb'),
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        // Legacy aliases
        orbitron: ['Inter', 'sans-serif'],
        space: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
