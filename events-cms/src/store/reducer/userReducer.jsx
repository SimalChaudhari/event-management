import { USER_LIST } from "../constants/actionTypes";

const initialState = {
    user: [],
    userByID: ''
};
const userReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case USER_LIST:
            return {
                ...state,
                user: payload,
            };
        // case "SET_USER_BY_DATA":
            // return {
            //     ...state,
            //     userByID: payload,
            // };
        default:
            return state;
    }
};
export default userReducer;
