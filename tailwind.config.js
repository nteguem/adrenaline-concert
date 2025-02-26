/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          300: '#4da8ff',
          400: '#3a97ff',
          500: '#1e85ff',
          600: '#0E80EB', // Couleur principale des boutons
          700: '#0a6cd2',
          800: '#075bb1',
        },
        black: '#000000',
        yellow: {
          300: '#ffff00', // Couleur d'accentuation
        },
      },
      fontFamily: {
        evangelion: ['var(--font-evangelion)'],
        din: ['var(--font-din)'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 5s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%': {
            opacity: '0.1',
            transform: 'scale(0.8)',
          },
          '50%': {
            opacity: '0.3',
            transform: 'scale(1.2)',
          },
          '100%': {
            opacity: '0.1',
            transform: 'scale(0.8)',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}