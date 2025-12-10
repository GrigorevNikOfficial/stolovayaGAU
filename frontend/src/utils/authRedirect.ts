const AUTH_PATHS = ['/login', '/register'];
const REDIRECT_KEY = 'postAuthRedirect';

const normalizePath = (path: string) => {
  if (!path) {
    return '/';
  }
  const delimiterIndex = path.search(/[?#]/);
  return delimiterIndex === -1 ? path : path.slice(0, delimiterIndex);
};

const isBrowser = () => typeof window !== 'undefined';

export const isAuthPath = (path: string | undefined | null): boolean => {
  if (!path) {
    return false;
  }
  return AUTH_PATHS.includes(normalizePath(path));
};

export const markAuthRedirect = (originPath?: string) => {
  if (!isBrowser()) {
    return;
  }
  const fallback = originPath && originPath.length > 0
    ? originPath
    : `${window.location.pathname}${window.location.search}${window.location.hash}` || '/';
  const normalized = normalizePath(fallback) || '/';

  if (isAuthPath(normalized)) {
    return;
  }

  sessionStorage.setItem(REDIRECT_KEY, fallback || '/');
};

export const consumeAuthRedirect = (): string | null => {
  if (!isBrowser()) {
    return null;
  }
  const value = sessionStorage.getItem(REDIRECT_KEY);
  if (value) {
    sessionStorage.removeItem(REDIRECT_KEY);
    return value;
  }
  return null;
};
