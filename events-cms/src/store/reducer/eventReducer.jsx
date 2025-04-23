import { EVENT_LIST, PARTICIPATED_EVENTS } from "../constants/actionTypes";

const initialState = {
    event: [],
    eventByID: '',
    participatedEvents: []
};
const eventReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case EVENT_LIST:
            return {
                ...state,
                event: payload,
            };
        case PARTICIPATED_EVENTS:
            return {
                ...state,
                participatedEvents: payload
            };
        default:
            return state;
    }
};
export default eventReducer;
