const NAME = 'ml_session';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days — matches refresh token TTL

export function setSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${NAME}=1; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${NAME}=; path=/; max-age=0; samesite=lax`;
}
