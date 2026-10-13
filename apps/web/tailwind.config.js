/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#d9e2f0',
          200: '#b8cbe5',
          300: '#8baed5',
          400: '#5c8ec2',
          500: '#3a72af',
          600: '#2c5992',
          700: '#234676',
          800: '#1b345a',
          850: '#13243f',
          900: '#0d182d',
          950: '#070d19',
        },
        fpt: {
          orange: '#f36f21',
          blue: '#0054a6',
          green: '#2ba84a',
        },
        sbi: {
          blue: '#003366',
          gold: '#c59b27',
          cyan: '#00a3e0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
