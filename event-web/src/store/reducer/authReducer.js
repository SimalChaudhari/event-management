import { AUTH_DATA, AUTH_LOADING } from '../../constants/actionTypes';

const initialState = {
  authenticated: false,
  authUser: null,
  loading: false,
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
    default:
      return state;
  }
};

export default authReducer;
