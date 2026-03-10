import axiosInstance from "../../config/axiosInstance";
import { EVENT_LIST, UPCOMING_EVENT_LIST, EVENT_LOADING, EVENT_ERROR, MY_REGISTERED_EVENT_LIST, MY_REGISTERED_EVENT_LOADING } from "../../constants/actionTypes";

/** Featured events: GET /api/events?page=1&limit=10 (auth required) */
export const fetchFeaturedEvents = (opts = {}) => async (dispatch) => {
  try {
    const params = new URLSearchParams();
    params.set("page", String(opts.page ?? 1));
    params.set("limit", String(opts.limit ?? 10));
    const { data } = await axiosInstance.get(`/events?${params}`);
    const list = data?.events ?? data?.data ?? [];
    dispatch({ type: EVENT_LIST, payload: Array.isArray(list) ? list : [] });
    return list;
  } catch (error) {
    dispatch({ type: EVENT_ERROR, payload: error?.message ?? "Failed to load featured events" });
    return [];
  }
};

/** Upcoming events: GET /api/events?upcoming=true (auth required) */
export const fetchUpcomingEvents = (opts = {}) => async (dispatch) => {
  try {
    const params = new URLSearchParams();
    params.set("upcoming", "true");
    const { data } = await axiosInstance.get(`/events?${params}`);
    const list = data?.events ?? data?.data ?? [];
    dispatch({ type: UPCOMING_EVENT_LIST, payload: Array.isArray(list) ? list : [] });
    return list;
  } catch (error) {
    dispatch({ type: EVENT_ERROR, payload: error?.message ?? "Failed to load upcoming events" });
    return [];
  }
};

/** Fetch both featured and upcoming (auth required). Keeps loading true until both complete. */
export const fetchFeaturedAndUpcomingEvents = (featuredOpts = {}) => async (dispatch) => {
  dispatch({ type: EVENT_LOADING, payload: true });
  try {
    const [featured, upcoming] = await Promise.all([
      axiosInstance.get(`/events?page=${featuredOpts.page ?? 1}&limit=${featuredOpts.limit ?? 10}`).then((r) => r.data?.events ?? r.data?.data ?? []),
      axiosInstance.get(`/events?upcoming=true`).then((r) => r.data?.events ?? r.data?.data ?? []),
    ]);
    dispatch({ type: EVENT_LIST, payload: Array.isArray(featured) ? featured : [] });
    dispatch({ type: UPCOMING_EVENT_LIST, payload: Array.isArray(upcoming) ? upcoming : [] });
  } catch (error) {
    dispatch({ type: EVENT_ERROR, payload: error?.message ?? "Failed to load events" });
  } finally {
    dispatch({ type: EVENT_LOADING, payload: false });
  }
};

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

/** My events: GET /api/register-events/all?page=1&limit=10 (auth required). Store full items so detail can use register-event id. */
export const fetchMyRegisteredEvents = (opts = {}) => async (dispatch) => {
  const limit = opts.limit ?? 10;
  const page = opts.page ?? 1;
  dispatch({ type: MY_REGISTERED_EVENT_LOADING, payload: true });
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    const { data } = await axiosInstance.get(`/register-events/all?${params.toString()}`);
    const rawList = data?.data ?? [];
    dispatch({ type: MY_REGISTERED_EVENT_LIST, payload: rawList });
    return rawList;
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
