import { toast } from "react-toastify";
import {
  AUTH_DATA,
  AUTH_LOADING,
  AUTH_ERROR,
} from "../../constants/actionTypes";
import { authService } from "../../services/authService";
import { userService } from "../../services/userService";

export const login = (payload) => async (dispatch) => {
  dispatch({ type: AUTH_LOADING, payload: true });
  try {
    const { data } = await authService.login(payload);
    if (data.requiresVerification) {
      const message = data.message || "Email verification required";
      dispatch({ type: AUTH_ERROR, payload: message });
      return { success: false, requiresVerification: true, data };
    }
    if (data.success && data.accessToken) {
      authService.setStoredAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      dispatch({ type: AUTH_DATA, payload: data.user });
      toast.success(data.message || "Login successful");
      return { success: true, message: data.message };
    }
    const message = data.message || "Login failed";
    dispatch({ type: AUTH_ERROR, payload: message });
    return { success: false, payload: message };
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Login failed";
    dispatch({ type: AUTH_ERROR, payload: message });
    dispatch({ type: AUTH_LOADING, payload: false });
    return { success: false, payload: message };
  } finally {
    dispatch({ type: AUTH_LOADING, payload: false });
  }
};

export const register = (payload) => async (dispatch) => {
  dispatch({ type: AUTH_LOADING, payload: true });
  try {
    const { data } = await authService.register(payload);
    if (data.message) {
      dispatch({ type: AUTH_LOADING, payload: false });
      toast.success(data.message);
      return { success: true, message: data.message };
    }
    const message = data.message || "Registration failed";
    dispatch({ type: AUTH_ERROR, payload: message });
    return { success: false, payload: message };
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Registration failed";
    dispatch({ type: AUTH_ERROR, payload: message });
    dispatch({ type: AUTH_LOADING, payload: false });
    return { success: false, payload: message };
  } finally {
    dispatch({ type: AUTH_LOADING, payload: false });
  }
};

export const logout = () => async (dispatch) => {
  try {
    const { data } = await authService.logout();
    if (data.success) {
      authService.clearStoredAuth();
      dispatch({ type: "LOGOUT" });
      toast.success(data?.message || "Logged out successfully");
    } else {
      const message = data?.message || "Failed to logout";
      dispatch({ type: AUTH_ERROR, payload: message });
      toast.error(message);
    }
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to logout";
      dispatch({ type: AUTH_ERROR, payload: message });
      toast.error(message);
    }
};

export const setAuthFromStorage = () => (dispatch) => {
  const { token, user } = authService.getStoredAuth();
  if (token && user) {
    dispatch({ type: AUTH_DATA, payload: user });
  }
};

export const updateProfile = (payload) => async (dispatch) => {
  try {
    const { data } = await userService.updateProfile(payload);
    if (data?.success && data?.data) {
      const { token, refreshToken } = authService.getStoredAuth();
      const user = data.data;
      if (token && refreshToken) {
        authService.setStoredAuth({ accessToken: token, refreshToken, user });
      }
      dispatch({ type: AUTH_DATA, payload: user });
      toast.success(data.message || 'Profile updated successfully');
      return { success: true, data: user };
    }
    return { success: false, message: data?.message || 'Update failed' };
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Profile update failed';
    toast.error(message);
    return { success: false, message };
  }
};

export const forgotPassword = (email) => async (dispatch) => {
  try {
    const { data } = await authService.forgotPassword(email);
    const message = data?.message || "OTP sent to your email";
    toast.success(message);
    return { success: true, message: data?.message };
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Request failed";
    return { success: false, message };
  }
};

export const resetPassword = (payload) => async (dispatch) => {
  try {
    const { data } = await authService.resetPassword({
      otp: payload.otp,
      email: payload.email,
      newPassword: payload.newPassword,
    });
    const message = data?.message || "Password changed successfully";
    toast.success(message);
    return { success: true, message: data?.message };
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Reset failed";
    return { success: false, message };
  }
};

export const verifyEmail = (payload) => async (dispatch) => {
  dispatch({ type: AUTH_LOADING, payload: true });
  try {
    const { data } = await authService.verifyEmail(payload);
    if (data.success && data.accessToken) {
      authService.setStoredAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      dispatch({ type: AUTH_DATA, payload: data.user });
      toast.success(data.message || "Account verified successfully");
      return { success: true, message: data.message };
    }
    const message = data.message || "Verification failed";
    dispatch({ type: AUTH_ERROR, payload: message });
    return { success: false, payload: message };
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Verification failed";
    dispatch({ type: AUTH_ERROR, payload: message });
    return { success: false, payload: message };
  } finally {
    dispatch({ type: AUTH_LOADING, payload: false });
  }
};
