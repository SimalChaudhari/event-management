import { EVENT_LIST, UPCOMING_EVENT_LIST, EVENT_LOADING, EVENT_ERROR, MY_REGISTERED_EVENT_LIST, MY_REGISTERED_EVENT_LOADING } from '../../constants/actionTypes';

const initialState = {
  list: [],
  upcoming: [],
  myRegisteredEvents: [],
  myRegisteredEventsLoading: false,
  loading: false,
  error: null,
};

const eventReducer = (state = initialState, { type, payload } = {}) => {
  switch (type) {
    case EVENT_LIST:
      return { ...state, list: payload ?? [], loading: false, error: null };
    case UPCOMING_EVENT_LIST:
      return { ...state, upcoming: payload ?? [], loading: false, error: null };
    case MY_REGISTERED_EVENT_LIST:
      return { ...state, myRegisteredEvents: payload ?? [], myRegisteredEventsLoading: false, error: null };
    case MY_REGISTERED_EVENT_LOADING:
      return { ...state, myRegisteredEventsLoading: payload };
    case EVENT_LOADING:
      return { ...state, loading: payload };
    case EVENT_ERROR:
      return { ...state, loading: false, myRegisteredEventsLoading: false, error: payload };
    default:
      return state;
  }
};

export default eventReducer;
