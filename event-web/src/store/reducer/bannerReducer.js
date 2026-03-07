import { BANNER_DATA, BANNER_LOADING, BANNER_ERROR } from '../../constants/actionTypes';

const initialState = {
  data: null,
  loading: true,
  error: null,
};

const bannerReducer = (state = initialState, { type, payload } = {}) => {
  switch (type) {
    case BANNER_DATA:
      return { ...state, data: payload, loading: false, error: null };
    case BANNER_LOADING:
      return { ...state, loading: payload };
    case BANNER_ERROR:
      return { ...state, loading: false, error: payload };
    default:
      return state;
  }
};

export default bannerReducer;
