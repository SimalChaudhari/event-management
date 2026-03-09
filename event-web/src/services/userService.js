import axiosInstance from '../config/axiosInstance';

export const userService = {
  getMyQRCode(userId, config = {}) {
    return axiosInstance.get(`/users/qr-code/generate/${userId}`, config);
  },

  updateProfile(payload, profilePictureFile = null) {
    if (profilePictureFile) {
      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === 'profilePicture') return; // only send the file under this name
        const value = payload[key];
        if (value != null && value !== '') formData.append(key, value);
      });
      formData.append('profilePicture', profilePictureFile);
      return axiosInstance.put('/users/profile/update', formData);
    }
    return axiosInstance.put('/users/profile/update', payload);
  },
};
