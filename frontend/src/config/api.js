/**
 * Centralized API configuration for SHUBHAM AI OS
 * All API calls must use this base URL to ensure fallback safety.
 */
export const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://shubham-ai-backend.onrender.com';

/** Default request timeout in milliseconds (30 s — accounts for Render cold starts) */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Safe fetch wrapper — adds timeout, try/catch and a standard error shape.
 * Returns { data, error } — never throws.
 */
export async function safeFetch(path, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const url = `${API_URL}${path}`;
  const startTime = performance.now();

  console.log(`[HTTP ➟] ${options.method || 'GET'} ${url}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'omit', // Required for cross-origin without cookies
      signal: controller.signal,
    });
    clearTimeout(timer);

    const elapsed = Math.round(performance.now() - startTime);
    console.log(`[HTTP ✓] ${res.status} in ${elapsed}ms — ${path}`);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { data: null, error: `Server error ${res.status}: ${text || res.statusText}` };
    }

    const data = await res.json().catch(() => null);
    return { data, error: null };
  } catch (err) {
    clearTimeout(timer);
    const elapsed = Math.round(performance.now() - startTime);
    if (err.name === 'AbortError') {
      console.warn(`[HTTP ✘] TIMEOUT after ${elapsed}ms — ${path}`);
      return { data: null, error: '⚠️ Request timed out. AI server may be starting up on Render.' };
    }
    console.error(`[HTTP ✘] NETWORK ERROR after ${elapsed}ms — ${path}`, err.message);
    return { data: null, error: '⚠️ AI server temporarily unavailable. Check your connection.' };
  }
}
