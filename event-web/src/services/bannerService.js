import axiosInstance from '../config/axiosInstance';

export async function getBannerEvents() {
  const { data } = await axiosInstance.get('/banner-events');
  if (data?.message && !data?.imageUrls) return null;
  return data;
}
