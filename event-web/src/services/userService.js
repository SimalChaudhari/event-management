import axiosInstance from '../config/axiosInstance';

export const userService = {
  getMyQRCode(userId) {
    return axiosInstance.get(`/users/qr-code/generate/${userId}`);
  },

  updateProfile(payload) {
    return axiosInstance.put('/users/profile/update', payload);
  },
};
