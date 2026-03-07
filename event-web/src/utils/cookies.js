/**
 * Cookie helpers for auth storage (replaces localStorage)
 */

const defaultDays = 7;

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name, value, days = defaultDays) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function removeCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}
