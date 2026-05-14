/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        navy: {
          DEFAULT: '#1e293b',
          dark: '#0f172a',
        },
        ht: {
          green:     '#5DBB63',
          greenDark: '#4aa850',
          mint:      '#DFF6E3',
          bg:        '#F7FAF7',
          text:      '#1E1E1E',
        },
      },
      keyframes: {
        floatA: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':     { transform: 'translateY(-20px) rotate(8deg)' },
        },
        floatB: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(14px) rotate(-6deg)' },
        },
        gradientShift: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        floatA: 'floatA 6s ease-in-out infinite',
        floatB: 'floatB 8s ease-in-out infinite',
        gradientShift: 'gradientShift 8s ease infinite',
      },
    },
  },
  plugins: [],
}
