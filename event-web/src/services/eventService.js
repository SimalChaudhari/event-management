import axiosInstance from '../config/axiosInstance';

export async function getMobileEventList(opts = {}) {
  const params = new URLSearchParams();
  if (opts.upcoming) params.set('upcoming', 'true');
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.page) params.set('page', String(opts.page));
  const url = `/events/public/mobile-list${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await axiosInstance.get(url);
  return data?.data ?? [];
}

export async function getEventById(id, opts = {}) {
  const { signal } = opts;
  const { data } = await axiosInstance.get(`/events/${id}`, { signal });
  return data?.data ?? data;
}
