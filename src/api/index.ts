// Unified API client — base fetch wrapper with auth handling

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function dispatchSessionExpiry() {
  window.dispatchEvent(new CustomEvent('eec-session-expired'));
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 || res.status === 403) {
    dispatchSessionExpiry();
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message = data.error || data.message || `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

const apiClient = { apiFetch, ApiError, dispatchSessionExpiry, API_BASE };
export default apiClient;
