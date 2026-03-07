import axiosInstance from "../../config/axiosInstance";
import { EVENT_LIST, UPCOMING_EVENT_LIST, EVENT_LOADING, EVENT_ERROR, MY_REGISTERED_EVENT_LIST, MY_REGISTERED_EVENT_LOADING } from "../../constants/actionTypes";

export const fetchMobileEventList =
  (opts = {}) =>
  async (dispatch) => {
    dispatch({ type: EVENT_LOADING, payload: true });
    try {
      const params = new URLSearchParams();
      if (opts.upcoming) params.set("upcoming", "true");
      if (opts.limit) params.set("limit", String(opts.limit));
      if (opts.page) params.set("page", String(opts.page));
      const url = `/events/public/mobile-list${params.toString() ? `?${params.toString()}` : ""}`;
      const { data } = await axiosInstance.get(url);
      const list = data?.data ?? [];
      dispatch({
        type: opts.upcoming ? UPCOMING_EVENT_LIST : EVENT_LIST,
        payload: list,
      });
      return list;
    } catch (error) {
      dispatch({
        type: EVENT_ERROR,
        payload: error?.message ?? "Failed to load events",
      });
    return [];
  } finally {
    dispatch({ type: EVENT_LOADING, payload: false });
  }
};

export const fetchMyRegisteredEvents = (opts = {}) => async (dispatch) => {
  const limit = opts.limit ?? 4;
  dispatch({ type: MY_REGISTERED_EVENT_LOADING, payload: true });
  try {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("page", "1");
    const { data } = await axiosInstance.get(`/register-events/all?${params.toString()}`);
    const rawList = data?.data ?? [];
    const eventList = rawList.map((item) => item.event).filter(Boolean);
    dispatch({ type: MY_REGISTERED_EVENT_LIST, payload: eventList });
    return eventList;
  } catch (error) {
    dispatch({
      type: EVENT_ERROR,
      payload: error?.message ?? "Failed to load my events",
    });
    return [];
  } finally {
    dispatch({ type: MY_REGISTERED_EVENT_LOADING, payload: false });
  }
};
