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
          indigo: withOpacityValue('--space-indigo'),
          grape: withOpacityValue('--dusty-grape'),
          lilac: withOpacityValue('--lilac-ash'),
          almond: withOpacityValue('--almond-silk'),
          seashell: withOpacityValue('--seashell'),
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
          blush: withOpacityValue('--almond-silk'),
        },
        gray: {
          50: '#f8f6f4',
          100: '#f2e9e4',
          200: '#e6dcd7',
          300: '#d7c8c3',
          400: '#c9ada7',
          500: '#b497a1',
          600: '#9a8c98',
          700: '#706375',
          800: '#4a4e69',
          900: '#22223b',
          950: '#151320',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        'brand-card': '0 18px 45px rgba(34, 34, 59, 0.12)',
      },
      backgroundImage: {
        'brand-overlay':
          'linear-gradient(135deg, rgba(34,34,59,0.92), rgba(74,78,105,0.8))',
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
