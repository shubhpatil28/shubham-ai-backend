/**
 * Centralized API configuration for SHUBHAM AI OS
 * All API calls must use this base URL to ensure fallback safety.
 */
export const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://shubham-ai-backend.onrender.com';

/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Safe fetch wrapper — adds timeout, try/catch and a standard error shape.
 * Returns { data, error } — never throws.
 */
export async function safeFetch(path, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { data: null, error: `Server error ${res.status}: ${text || res.statusText}` };
    }

    const data = await res.json().catch(() => null);
    return { data, error: null };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { data: null, error: '⚠️ Request timed out. AI server may be starting up on Render.' };
    }
    return { data: null, error: '⚠️ AI server temporarily unavailable. Check your connection.' };
  }
}
