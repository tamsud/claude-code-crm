import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary indigo — used for actions, links, nav active states
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Surfaces & backgrounds
        surface: {
          base:    '#f8fafc',
          card:    '#ffffff',
          border:  '#e2e8f0',
          subtle:  '#f1f5f9',
          overlay: 'rgba(15,23,42,0.45)',
        },
        // Semantic
        success: {
          light: '#dcfce7',
          DEFAULT: '#16a34a',
          dark:  '#15803d',
        },
        warning: {
          light: '#fef9c3',
          DEFAULT: '#ca8a04',
          dark:  '#a16207',
        },
        danger: {
          light: '#fee2e2',
          DEFAULT: '#dc2626',
          dark:  '#b91c1c',
        },
        info: {
          light: '#dbeafe',
          DEFAULT: '#2563eb',
          dark:  '#1d4ed8',
        },
        // Brand (sidebar navy)
        brand: {
          DEFAULT: '#1e3a5f',
          light:   '#2d5f9e',
          accent:  '#6366f1',
          muted:   '#94a3b8',
        },
      },
      borderRadius: {
        card: '0.75rem',    // 12px
        xl:   '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        xs:       '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        card:     '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        dropdown: '0 8px 16px -2px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.08)',
        modal:    '0 20px 40px -8px rgb(0 0 0 / 0.2)',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem' }],
        sm:    ['0.8125rem',{ lineHeight: '1.25rem' }],
        base:  ['0.875rem', { lineHeight: '1.5rem' }],
        lg:    ['1rem',     { lineHeight: '1.5rem' }],
        xl:    ['1.125rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.25rem',  { lineHeight: '1.75rem' }],
        '3xl': ['1.5rem',   { lineHeight: '2rem' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
} satisfies Config
