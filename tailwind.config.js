export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'app-bg': '#050507',
        'panel-bg': '#0A0B0E',
        'border-primary': '#1E2028',
        'text-primary': '#F3F4F6',
        'text-secondary': '#8B92A5',
        'accent-pace': '#00E5FF',
        'accent-hr': '#FF2A5F',
        'accent-elevation': '#B5FF3A',
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger': '#EF4444',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.02em',
        relaxed: '0.05em',
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.125rem',
      },
    },
  },
  plugins: [],
}
