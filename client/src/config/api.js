/**
 * API base URL for all backend requests.
 * Set VITE_API_URL in Vercel (no trailing slash), e.g. https://survey-app-erzn.onrender.com
 * Paths are appended under /api (e.g. /api/surveys).
 */
const trimTrailingSlash = (url) => url.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
  const legacy = import.meta.env.VITE_API_BASE_URL;
  if (legacy) {
    return trimTrailingSlash(legacy);
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return `${trimTrailingSlash(apiUrl)}/api`;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }

  console.error(
    '[config/api] VITE_API_URL is not set. Add it in Vercel → Project → Settings → Environment Variables.'
  );
  return 'https://survey-app-erzn.onrender.com/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

/** Build full API URL: apiUrl('/surveys') → …/api/surveys */
export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
