import { AUTH_DATA } from "../constants/actionTypes";

const initialState = {
  authenticated: false,
  authUser: null,
  loading: true  // Add loading state
};

const authReducer = (state = initialState, { type, payload } = {}) => {
  switch (type) {
    case AUTH_DATA:
      return {
        ...state,
        authenticated: true,
        authUser: payload.user,
        loading: false
      };

    case "LOGOUT":
      return {
        ...initialState,
        loading: false
      };

    case "SET_LOADING":
      return {
        ...state,
        loading: payload
      };

    default:
      return state;
  }
};

export default authReducer;
