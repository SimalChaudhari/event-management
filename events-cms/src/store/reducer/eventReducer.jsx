import { EVENT_BY_ID, EVENT_LIST, EVENT_DELETE, EVENT_FILTER_LIST, GALLERY_LIST, PARTICIPATED_EVENTS, UPCOMING_EVENT_LIST, UPDATE_EVENT_TAB_VISIBILITY, CREATE_EVENT, UPDATE_EVENT, REGISTERED_PARTICIPANTS_WITH_ATTENDANCE, ATTENDANCE_LOADING, ATTENDANCE_ERROR } from "../constants/actionTypes";

const initialState = {
    event: [],
    eventFilterList: [], // Store events for dropdown filter
    galleryList: [],
    eventByID: '',
    participatedEvents: []  ,
    upcomingEvents: [],
    registeredParticipantsWithAttendance: null,
    attendanceLoading: false,
    attendanceError: null,
};
const eventReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case EVENT_LIST:
            return {
                ...state,
                event: payload,
            };
        case EVENT_DELETE: {
            // Remove the deleted event from the events array
            const deletedEventId = payload;
            return {
                ...state,
                event: {
                    ...state.event,
                    events: state.event?.events?.filter(event => event.id !== deletedEventId) || []
                },
                upcomingEvents: {
                    ...state.upcomingEvents,
                    events: state.upcomingEvents?.events?.filter(event => event.id !== deletedEventId) || []
                },
                eventFilterList: state.eventFilterList?.filter(event => event.id !== deletedEventId) || []
            };
        }
        case EVENT_FILTER_LIST:
            return {
                ...state,
                eventFilterList: payload || []
            };
        case EVENT_BY_ID:
            return {
                ...state,
                eventByID: payload
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
        case UPDATE_EVENT_TAB_VISIBILITY:
            return {
                ...state,
                eventByID: {
                    ...state.eventByID,
                    tabVisibility: payload.tabVisibility
                }
            };
        case CREATE_EVENT:
            // Add new event to the events list
            const newEvent = payload;
            const currentEvents = state.event?.events || [];
            return {
                ...state,
                event: {
                    ...state.event,
                    events: [newEvent, ...currentEvents]
                },
                eventFilterList: [newEvent, ...(state.eventFilterList || [])]
            };
        case UPDATE_EVENT: {
            // Update existing event in the events list
            const updatedEvent = payload;
            const updatedEventId = updatedEvent.id;
            return {
                ...state,
                event: {
                    ...state.event,
                    events: state.event?.events?.map(event => 
                        event.id === updatedEventId ? updatedEvent : event
                    ) || []
                },
                upcomingEvents: {
                    ...state.upcomingEvents,
                    events: state.upcomingEvents?.events?.map(event => 
                        event.id === updatedEventId ? updatedEvent : event
                    ) || []
                },
                eventFilterList: state.eventFilterList?.map(event => 
                    event.id === updatedEventId ? updatedEvent : event
                ) || [],
                eventByID: state.eventByID?.id === updatedEventId ? updatedEvent : state.eventByID
            };
        }
        case REGISTERED_PARTICIPANTS_WITH_ATTENDANCE:
            return {
                ...state,
                registeredParticipantsWithAttendance: payload,
                attendanceError: null
            };
        case ATTENDANCE_LOADING:
            return {
                ...state,
                attendanceLoading: payload
            };
        case ATTENDANCE_ERROR:
            return {
                ...state,
                attendanceError: payload,
                registeredParticipantsWithAttendance: null
            };
        default:
            return state;
    }
};
export default eventReducer;
