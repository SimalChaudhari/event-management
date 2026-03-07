import { AUTH_DATA, AUTH_ERROR, AUTH_LOADING } from '../../constants/actionTypes';

const initialState = {
  authenticated: false,
  authUser: null,
  loading: false,
  error: null,
};

const authReducer = (state = initialState, { type, payload } = {}) => {
  switch (type) {
    case AUTH_DATA:
      return {
        ...state,
        authenticated: true,
        authUser: payload?.user ?? payload,
        loading: false,
      };
    case 'LOGOUT':
      return { ...initialState };
    case AUTH_LOADING:
      return { ...state, loading: payload };
    case AUTH_ERROR:
      return { ...state, loading: false, error: payload };
    default:
      return state;
  }
};

export default authReducer;
