import { SPEAKER_LIST, CREATE_SPEAKER, UPDATE_SPEAKER, DELETE_SPEAKER } from "../constants/actionTypes";

const initialState = {
    speakers: [],
    loading: false,
    error: null
};

const speakerReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case SPEAKER_LIST:
            return {
                ...state,
                speakers: payload,
                loading: false,
                error: null
            };
        case CREATE_SPEAKER:
            return {
                ...state,
                speakers: [payload, ...state.speakers],
                loading: false,
                error: null
            };
        case UPDATE_SPEAKER:
            return {
                ...state,
                speakers: state.speakers.map(speaker => 
                    speaker.id === payload.id ? payload : speaker
                ),
                loading: false,
                error: null
            };
        case DELETE_SPEAKER:
            return {
                ...state,
                speakers: state.speakers.filter(speaker => speaker.id !== payload),
                loading: false,
                error: null
            };
        default:
            return state;
    }
};

export default speakerReducer;
