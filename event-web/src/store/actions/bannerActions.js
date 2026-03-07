import axiosInstance from '../../config/axiosInstance';
import { BANNER_DATA, BANNER_LOADING, BANNER_ERROR } from '../../constants/actionTypes';

export const fetchBannerEvents = () => async (dispatch) => {
  dispatch({ type: BANNER_LOADING, payload: true });
  try {
    const { data } = await axiosInstance.get('/banner-events');
    if (data?.message && !data?.imageUrls) {
      dispatch({ type: BANNER_DATA, payload: null });
      return null;
    }
    dispatch({ type: BANNER_DATA, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: BANNER_ERROR, payload: error?.message ?? 'Failed to load banner' });
    return null;
  } finally {
    dispatch({ type: BANNER_LOADING, payload: false });
  }
};
