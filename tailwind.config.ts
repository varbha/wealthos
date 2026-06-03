import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mf: '#378ADD',
        equity: '#1D9E75',
        fo: '#D4537E',
        fd: '#EF9F27',
      },
    },
  },
  plugins: [],
}

export default config
