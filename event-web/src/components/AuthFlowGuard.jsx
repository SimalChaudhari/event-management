import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';

/**
 * Auth flow session keys and TTL.
 * Security: This guard is a UX layer only. Real security is enforced by the API
 * (e.g. reset-password requires valid OTP for that email; rate limiting on forgot-password).
 */
const AUTH_FLOW_KEYS = {
  FORGOT_PASSWORD_AT: 'auth_flow_forgot_password_at',
  RESET_PASSWORD_AT: 'auth_flow_reset_password_at',
};
const AUTH_FLOW_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getStoredTimestamp(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

function setStoredTimestamp(key) {
  try {
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // ignore
  }
}

function clearStoredTimestamp(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function isTimestampValid(ts) {
  return ts != null && !Number.isNaN(ts) && Date.now() - ts <= AUTH_FLOW_TTL_MS;
}

/**
 * Guard for Forgot Password: allow only when navigated from Login (state.fromAuth).
 * On allow, writes a time-limited session flag so Reset Password can validate the flow.
 */
export function ForgotPasswordGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const allowed = useRef(false);

  useEffect(() => {
    if (!location.state?.fromAuth) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }
    allowed.current = true;
    setStoredTimestamp(AUTH_FLOW_KEYS.FORGOT_PASSWORD_AT);
  }, [location.state?.fromAuth, navigate]);

  if (!location.state?.fromAuth) {
    return null;
  }
  return <Outlet />;
}

/**
 * Guard for Reset Password: allow only when navigated from Forgot Password success step
 * (state.fromForgotPassword) and the forgot-password step happened within TTL.
 * Clears the forgot-password flag and sets reset-password flag so the flow is one-way.
 */
export function ResetPasswordGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const forgotTs = getStoredTimestamp(AUTH_FLOW_KEYS.FORGOT_PASSWORD_AT);
  const hasValidState = Boolean(location.state?.fromForgotPassword);
  const hasValidFlow = isTimestampValid(forgotTs);

  useEffect(() => {
    if (!hasValidState || !hasValidFlow) {
      clearStoredTimestamp(AUTH_FLOW_KEYS.FORGOT_PASSWORD_AT);
      navigate(ROUTES.FORGOT_PASSWORD, { replace: true });
    } else {
      setStoredTimestamp(AUTH_FLOW_KEYS.RESET_PASSWORD_AT);
    }
  }, [hasValidState, hasValidFlow, navigate]);

  if (!hasValidState || !hasValidFlow) {
    return null;
  }
  return <Outlet />;
}
