// Shared API base URL — build-time env, runtime config.js, or production fallback.
declare global {
  interface Window {
    __EEC_API_URL__?: string;
  }
}

const PRODUCTION_API_BASE =
  'https://eec-backend-app-buh6htfxfvgmaghd.denmarkeast-01.azurewebsites.net/api';

export function getApiBase(): string {
  const fromEnv = process.env.REACT_APP_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const fromRuntime = typeof window !== 'undefined' ? window.__EEC_API_URL__ : undefined;
  if (fromRuntime) return fromRuntime.replace(/\/$/, '');

  // Never fall back to same-origin /api on Static Web Apps — there is no API there.
  if (typeof window !== 'undefined' && window.location.hostname.includes('azurestaticapps.net')) {
    return PRODUCTION_API_BASE;
  }

  return '/api';
}
