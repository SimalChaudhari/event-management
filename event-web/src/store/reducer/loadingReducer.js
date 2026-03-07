import { EVENT_LOADING, BANNER_LOADING, AUTH_LOADING } from '../../constants/actionTypes';

const initialState = {
  event: false,
  banner: false,
  auth: false,
  global: false,
};

const loadingReducer = (state = initialState, { type, payload } = {}) => {
  let newState = state;
  switch (type) {
    case EVENT_LOADING:
      newState = { ...state, event: payload };
      break;
    case BANNER_LOADING:
      newState = { ...state, banner: payload };
      break;
    case AUTH_LOADING:
      newState = { ...state, auth: payload };
      break;
    default:
      return state;
  }
  newState.global = newState.event || newState.banner || newState.auth;
  return newState;
};

export default loadingReducer;
