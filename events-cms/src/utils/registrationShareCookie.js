/**
 * Cookie helpers for registration share access code.
 * Store one object keyed by shareToken so user doesn't re-enter code per event.
 */
const COOKIE_NAME = 'registration_share_codes';
const MAX_AGE_DAYS = 30;

function getCookieObject() {
  if (typeof document === 'undefined') return {};
  const raw = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE_NAME + '='));
  if (!raw) return {};
  try {
    const json = decodeURIComponent(raw.slice(COOKIE_NAME.length + 1));
    return JSON.parse(json) || {};
  } catch {
    return {};
  }
}

function setCookieObject(obj) {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(JSON.stringify(obj));
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getRegistrationShareCode(shareToken) {
  const obj = getCookieObject();
  return obj[shareToken] || null;
}

export function setRegistrationShareCode(shareToken, accessCode) {
  const obj = getCookieObject();
  obj[shareToken] = accessCode;
  setCookieObject(obj);
}

export function removeRegistrationShareCode(shareToken) {
  const obj = getCookieObject();
  delete obj[shareToken];
  setCookieObject(obj);
}
