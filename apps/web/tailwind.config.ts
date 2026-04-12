import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f7f7fb',
          100: '#efeff7',
          200: '#d9d9e8',
          300: '#b9bad4',
          400: '#8d90b2',
          500: '#666b90',
          600: '#4b5274',
          700: '#373d59',
          800: '#252a3f',
          900: '#171b2d'
        },
        accent: {
          50: '#f5f9ff',
          100: '#e8f0ff',
          200: '#c9ddff',
          300: '#9bbfff',
          400: '#6696ff',
          500: '#3f71f4',
          600: '#2d57d1',
          700: '#2645a6',
          800: '#243b84',
          900: '#24346b'
        },
        success: '#2e8b57',
        warning: '#d17d1f',
        danger: '#c84c4c'
      },
      borderRadius: {
        shell: '1.5rem'
      },
      boxShadow: {
        shell: '0 28px 60px -28px rgba(23, 27, 45, 0.35)'
      },
      fontFamily: {
        sans: ['"Avenir Next"', '"PingFang SC"', '"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SFMono-Regular"', 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config
