import { AUTH_DATA } from "../constants/actionTypes";

const initialState = {
  authenticated: !!localStorage.getItem("token"), // Check token presence
  authUser: JSON.parse(localStorage.getItem("userData"))?.user || null, // Use user data consistently
  loading: false
};

const authReducer = (state = initialState, { type, payload } = {}) => {
  switch (type) {
    case AUTH_DATA:
      return {
        ...state,
        authenticated: true,
        authUser: payload.user, // Ensure consistency with user structure
      };

    case "LOGOUT":
      return {
        authenticated: false,
        authUser: '',
      };


    default:
      return state;
  }
};

export default authReducer;
