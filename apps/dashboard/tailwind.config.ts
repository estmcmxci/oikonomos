import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0a0a0b',
        'bg-elevated': '#111114',
        'bg-card': 'rgba(17, 17, 20, 0.7)',
        'border-subtle': 'rgba(82, 152, 255, 0.15)',
        'border-accent': 'rgba(82, 152, 255, 0.4)',
        'text-primary': '#ffffff',
        'text-secondary': 'rgba(255, 255, 255, 0.6)',
        'text-tertiary': 'rgba(255, 255, 255, 0.4)',
        'accent-blue': '#5298FF',
        'accent-cyan': '#00D4AA',
        'accent-blue-glow': 'rgba(82, 152, 255, 0.3)',
        'color-usdc': '#2775CA',
        'color-dai': '#F5AC37',
        'color-weth': '#627EEA',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp 0.6s ease-out forwards',
        'fade-slide-down': 'fadeSlideDown 0.6s ease-out forwards',
        'slide-in-fade': 'slideInFade 0.4s ease-out forwards',
        'pulse-dot': 'pulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeSlideDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFade: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}

export default config
