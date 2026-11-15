/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#2B3A8F',
        coral: '#FF6B4A',
        mint: '#2FB59A',
        sun: '#FFC145',
        violet: '#7C5CFF',
        writing: '#C77DFF',
        grammar: '#5B7C99',
        cream: '#FFFBF5',
        ink: '#12172B',
        muted: '#6B7280',
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Inter Variable"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(18,23,43,0.06)',
        cardhover: '0 8px 30px rgba(18,23,43,0.10)',
      },
    },
  },
  plugins: [],
}
