import { EVENT_LIST, GALLERY_LIST, PARTICIPATED_EVENTS,UPCOMING_EVENT_LIST } from "../constants/actionTypes";

const initialState = {
    event: [],
    galleryList: [],
    eventByID: '',
    participatedEvents: []  ,
    upcomingEvents: [],
    
 
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
        case GALLERY_LIST:
            return {
                ...state,
                galleryList: payload
            };
        case UPCOMING_EVENT_LIST:
            return {
                ...state,
                upcomingEvents: payload
            };
        default:
            return state;
    }
};
export default eventReducer;
