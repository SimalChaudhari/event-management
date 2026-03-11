import axiosInstance from '../config/axiosInstance';
import { CACHE_CONFIG } from '../config/env';
import { getCookie, setCookie, removeCookie } from '../utils/cookies';

const AUTH = '/auth';

export const authService = {
  login(payload) {
    return axiosInstance.post(`${AUTH}/login`, payload);
  },

  register(payload) {
    return axiosInstance.post(`${AUTH}/register`, payload);
  },

  forgotPassword(email) {
    return axiosInstance.post(`${AUTH}/forgot-password`, { email });
  },

  resetPassword(payload) {
    return axiosInstance.post(`${AUTH}/reset-password`, payload);
  },

  logout() {
    return axiosInstance.post(`${AUTH}/signout`);
  },

  verifyEmail(payload) {
    return axiosInstance.post(`${AUTH}/verify-otp`, payload);
  },

  resendVerificationCode(email) {
    return axiosInstance.post(`${AUTH}/resend-otp`, { email });
  },

  refreshToken(refreshToken) {
    return axiosInstance.post(`${AUTH}/refresh-token`, { refreshToken });
  },

  getStoredAuth() {
    const token = getCookie(CACHE_CONFIG.TOKEN_KEY);
    const refreshToken = getCookie(CACHE_CONFIG.REFRESH_TOKEN_KEY);
    const userStr = getCookie(CACHE_CONFIG.USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, refreshToken, user };
  },

  setStoredAuth({ accessToken, refreshToken, user }) {
    if (accessToken) setCookie(CACHE_CONFIG.TOKEN_KEY, accessToken);
    if (refreshToken) setCookie(CACHE_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
    if (user) setCookie(CACHE_CONFIG.USER_KEY, JSON.stringify(user));
  },

  clearStoredAuth() {
    removeCookie(CACHE_CONFIG.TOKEN_KEY);
    removeCookie(CACHE_CONFIG.REFRESH_TOKEN_KEY);
    removeCookie(CACHE_CONFIG.USER_KEY);
  },
};
