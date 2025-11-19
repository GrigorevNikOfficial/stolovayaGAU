/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,vue}', './public/**/*.html'],
  theme: {
    extend: {
      colors: {
        green: {
          dark: '#2E7D32',
          darker: '#1B5E20',
          medium: '#4CAF50',
          light: '#E8F5E9',
          lighter: '#C8E6C9',
        },
        gray: {
          text: {
            primary: '#4B5563',
            secondary: '#6B7280',
          },
          background: {
            light: '#F8FAFC',
            medium: '#E2E8F0',
          },
          border: {
            primary: '#D1D5DB',
            secondary: '#E5E7EB',
          },
        },
        dark: {
          footer: '#111827',
        },
      },
      backgroundColor: {
        primary: '#FFFFFF',
        'gray-light': '#F8FAFC',
        'gray-medium': '#E2E8F0',
      },
      textColor: {
        'gray-primary': '#4B5563',
        'gray-secondary': '#6B7280',
      },
      borderColor: {
        'gray-primary': '#D1D5DB',
        'gray-secondary': '#E5E7EB',
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
