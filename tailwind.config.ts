import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effef6',
          100: '#d8fde9',
          200: '#b3f7d1',
          300: '#7eecb2',
          400: '#4cd992',
          500: '#25bf77',
          600: '#17a764',
          700: '#138353',
          800: '#126847',
          900: '#10553b'
        }
      }
    }
  },
  plugins: []
} satisfies Config
