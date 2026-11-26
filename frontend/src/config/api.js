
// Central API configuration

export const API_URL = (
  import.meta.env.VITE_API_URL || 'https://civisynq-backend.onrender.com/api'
).replace(/\/$/, '');

export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function getImageUrl(imagePath) {
  if (!imagePath) return '';

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return `${API_ORIGIN}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}
