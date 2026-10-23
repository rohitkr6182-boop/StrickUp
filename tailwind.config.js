/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"DM Sans"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        ink: '#1c2924',
        forest: '#315b47',
        mint: '#dff1e6',
        paper: '#f5f7f2',
        coral: '#f28c70',
        gold: '#e6b45c',
      },
      boxShadow: {
        soft: '0 12px 36px rgba(38, 65, 51, 0.08)',
      },
    },
  },
  plugins: [],
};
