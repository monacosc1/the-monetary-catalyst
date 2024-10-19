import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5064fa',
        secondary: '#f2ff49',
        background: '#08080d',
        'background-light': '#001e46',
        accent1: '#01baef',
        accent2: '#00f0b4',
        danger: '#ff4365',
        neutral: '#676767',
        'accent2-dark': '#00e3aa', // This is an example; adjust the color to your preference
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

export default config
