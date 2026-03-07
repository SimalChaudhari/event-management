import { EVENT_LIST, UPCOMING_EVENT_LIST, EVENT_LOADING, EVENT_ERROR } from '../../constants/actionTypes';

const initialState = {
  list: [],
  upcoming: [],
  loading: false,
  error: null,
};

const eventReducer = (state = initialState, { type, payload } = {}) => {
  switch (type) {
    case EVENT_LIST:
      return { ...state, list: payload ?? [], loading: false, error: null };
    case UPCOMING_EVENT_LIST:
      return { ...state, upcoming: payload ?? [], loading: false, error: null };
    case EVENT_LOADING:
      return { ...state, loading: payload };
    case EVENT_ERROR:
      return { ...state, loading: false, error: payload };
    default:
      return state;
  }
};

export default eventReducer;
