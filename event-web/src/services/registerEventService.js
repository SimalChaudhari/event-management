import axiosInstance from '../config/axiosInstance';

/**
 * Get a single register-event by ID (Rg_ID).
 * Response: { data: { id, userId, type, status, event, user, adminInfo, checkout, ... } }
 */
export async function getRegisterEventById(registerEventId, opts = {}) {
  const { signal } = opts;
  const { data } = await axiosInstance.get(`/register-events/${registerEventId}`, { signal });
  return data?.data ?? data;
}
