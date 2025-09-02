/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary colors - muted gold accent 
        primary: {
          50: '#fdf8f0',
          100: '#fbefd9',
          200: '#f6ddb2',
          300: '#efc481',
          400: '#e7a54e',
          500: '#B88B4C', 
          600: '#a67b43',
          700: '#8a6439',
          800: '#715135',
          900: '#5c432d',
          950: '#523720',
        },
        // Subtle accent colors for dark mode
        accent: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Professional backgrounds matching the design
        background: {
          light: '#F5F2EE',
          dark: '#1F2328',
        },
        // Dark mode backgrounds - darker charcoal grey with less blue intensity
        'bg-dark': '#1F2328',
        'surface-dark': '#2A2E35',
        'surface-elevated-dark': '#32363E',
        // Enhanced surface colors with elegant tones
        surface: {
          light: '#F0EDE8',
          dark: '#2A2E35',
          elevated: {
            light: '#FEFCFA',
            dark: '#32363E',
          }
        },
        // Elegant text colors matching the design
        text: {
          'text-primary-light': '#2D3240',
          'text-primary-dark': '#F5F2EE',
          'text-secondary-light': '#5A6070',
          'text-secondary-dark': '#A8A8A8',
          tertiary: {
            light: '#8A8F9A',
            dark: '#9B9690',
          }
        },
        // Mobile-optimized bias colors with high contrast
        bias: {
          left: {
            light: '#1565c0',
            dark: '#42a5f5',
            bg: '#e3f2fd',
            'bg-dark': '#0d47a1',
          },
          center: {
            light: '#2e7d32',
            dark: '#66bb6a',
            bg: '#e8f5e8',
            'bg-dark': '#1b5e20',
          },
          right: {
            light: '#d32f2f',
            dark: '#ef5350',
            bg: '#ffebee',
            'bg-dark': '#b71c1c',
          },
        },
        // Mobile-friendly interactive states
        interactive: {
          'border-light': '#E5E2DD',
          'border-dark': '#3A3A3A',
          hover: {
            light: '#f5f5f5',
            dark: '#37474f',
          },
          active: {
            light: '#eeeeee',
            dark: '#455a64',
          },
          focus: {
            light: '#e3f2fd',
            dark: '#263238',
          },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
        logo: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        serif: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        // Mobile-optimized typography scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        // Mobile-optimized spacing
        'mobile-xs': '0.25rem',
        'mobile-sm': '0.5rem', 
        'mobile-md': '1rem',
        'mobile-lg': '1.5rem',
        'mobile-xl': '2rem',
        // Safe area padding for mobile devices
        'safe': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      boxShadow: {
        // Mobile-optimized shadows
        'mobile': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'mobile-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'mobile-xl': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        // Mobile-friendly border radius
        'mobile': '0.5rem',
        'mobile-lg': '0.75rem',
      },
      animation: {
        // Mobile-optimized animations
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
