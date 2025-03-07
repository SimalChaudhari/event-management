import { EVENT_LIST } from "../constants/actionTypes";

const initialState = {
    event: [],
    eventByID: ''
};
const eventReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case EVENT_LIST:
            return {
                ...state,
                event: payload,
            };
 
        default:
            return state;
    }
};
export default eventReducer;
