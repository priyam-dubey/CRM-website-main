/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        border: { DEFAULT: '#E2E8F0', strong: '#CBD5E1' },
        primary: { DEFAULT: '#2563EB', hover: '#1D4ED8', subtle: '#EFF6FF', foreground: '#FFFFFF' },
        success: { DEFAULT: '#16A34A', subtle: '#F0FDF4' },
        warning: { DEFAULT: '#F59E0B', subtle: '#FFFBEB' },
        error:   { DEFAULT: '#DC2626', subtle: '#FEF2F2' },
        info:    { DEFAULT: '#0891B2', subtle: '#ECFEFF' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      maxWidth: { content: '1400px' },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
        dropdown: '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}
