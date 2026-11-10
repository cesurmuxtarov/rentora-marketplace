/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0e18',
        surface: '#0f131d',
        panel: '#171b26',
        elevated: '#1c1f2a',
        line: '#313540',
        mint: '#80d5cb',
        teal: '#0f766e',
        emerald: '#4edea3',
        amber: '#ffb95f',
        text: '#dfe2f1',
        muted: '#9aa7a5'
      },
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        body: ['Hanken Grotesk', 'system-ui', 'sans-serif']
      },
      boxShadow: { ambient: '0 18px 60px -30px rgba(0,0,0,.8)' }
    }
  },
  plugins: []
}
