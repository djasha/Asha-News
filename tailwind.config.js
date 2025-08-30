/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary brand colors
        primary: {
          500: '#3b82f6', // Dark mode primary
          600: '#2563eb', // Light mode primary
        },
        // Bias visualization colors
        bias: {
          left: {
            light: '#dc2626', // Red 600
            dark: '#ef4444',  // Red 500
          },
          center: {
            light: '#059669', // Emerald 600
            dark: '#10b981',  // Emerald 500
          },
          right: {
            light: '#2563eb', // Blue 600
            dark: '#3b82f6',  // Blue 500
          },
          mixed: {
            light: '#7c3aed', // Violet 600
            dark: '#8b5cf6',  // Violet 500
          },
        },
        // Custom semantic colors
        surface: {
          light: '#f8fafc', // Slate 50
          dark: '#1e293b',  // Slate 800
        },
        text: {
          primary: {
            light: '#0f172a', // Slate 900
            dark: '#f8fafc',  // Slate 50
          },
          secondary: {
            light: '#475569', // Slate 600
            dark: '#cbd5e1',  // Slate 300
          },
        },
        background: {
          light: '#ffffff',
          dark: '#0f172a',
        },
      },
      screens: {
        'xs': '320px',
        'sm': '768px',
        'md': '1024px',
        'lg': '1440px',
        'xl': '1920px',
      },
      fontSize: {
        // Mobile-first responsive typography
        'headline': ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-sm': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-lg': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['17px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-md': ['18px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'label': ['12px', { lineHeight: '1.3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }],
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
