const fallbackBaseUrl = 'http://localhost:5000/api';
const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
const sanitizedBaseUrl = (envBaseUrl && envBaseUrl.trim()) || fallbackBaseUrl;
const normalizedBaseUrl = sanitizedBaseUrl.replace(/\/+$/, '');

export const API_CONFIG = {
  BASE_URL: normalizedBaseUrl,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  TIMEOUT: 8000, // 8 seconds
} as const;
