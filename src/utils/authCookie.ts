const AUTH_COOKIE = "authToken";
const AUTH_LOCAL_KEY = "authToken";
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

/** Persist token in httpOnly-style cookie (client-set) and localStorage fallback. */
export function setAuthToken(token: string) {
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax; Max-Age=${MAX_AGE_SEC}`;
  localStorage.setItem(AUTH_LOCAL_KEY, token);
}

export function clearAuthToken() {
  document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  localStorage.removeItem(AUTH_LOCAL_KEY);
}

export function getAuthTokenFromFallback(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]*)`),
  );
  if (match?.[1]) return decodeURIComponent(match[1]);
  return localStorage.getItem(AUTH_LOCAL_KEY);
}
