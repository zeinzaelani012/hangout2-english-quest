/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#0F766E',
        coral: '#F05A47',
        mint: '#168A72',
        sun: '#D89B24',
        violet: '#6657C8',
        writing: '#9B5CC4',
        grammar: '#53708A',
        cream: '#F5F7FA',
        ink: '#172033',
        muted: '#657083',
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Inter Variable"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,32,51,0.05), 0 8px 24px rgba(23,32,51,0.06)',
        cardhover: '0 2px 4px rgba(23,32,51,0.06), 0 14px 32px rgba(23,32,51,0.10)',
      },
    },
  },
  plugins: [],
}
