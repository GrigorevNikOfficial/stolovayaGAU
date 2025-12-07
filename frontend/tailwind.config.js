const withOpacityValue = (variable) => ({ opacityValue }) => {
  if (opacityValue !== undefined) {
    return `rgb(var(${variable}) / ${opacityValue})`;
  }
  return `rgb(var(${variable}))`;
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,vue}', './public/**/*.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: withOpacityValue('--color-ink'),
          grape: withOpacityValue('--color-charcoal'),
          lilac: withOpacityValue('--color-graphite'),
          almond: withOpacityValue('--color-mint'),
          seashell: withOpacityValue('--color-shell'),
        },
        surface: {
          base: withOpacityValue('--surface-base'),
          muted: withOpacityValue('--surface-muted'),
          elevated: withOpacityValue('--surface-elevated'),
        },
        border: {
          soft: withOpacityValue('--border-soft'),
          subtle: withOpacityValue('--border-subtle'),
        },
        text: {
          primary: withOpacityValue('--text-primary'),
          secondary: withOpacityValue('--text-secondary'),
          muted: withOpacityValue('--text-muted'),
        },
        accent: {
          blush: withOpacityValue('--color-mint-soft'),
        },
        gray: {
          50: '#f9fafb',
          100: '#f4f7f5',
          200: '#e5ece7',
          300: '#cfd9d2',
          400: '#9ca7a0',
          500: '#6d756f',
          600: '#4f5650',
          700: '#2f332f',
          800: '#1c1f1d',
          900: '#121312',
          950: '#060707',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        'brand-card': '0 20px 45px rgba(16, 185, 129, 0.18)',
      },
      backgroundImage: {
        'brand-overlay':
          'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(15,118,110,0.85))',
      },
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
  plugins: [],
};
