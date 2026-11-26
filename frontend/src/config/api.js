// Central API configuration for local development and production deployment.
export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '');

export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function getImageUrl(imagePath) {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${API_ORIGIN}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}
