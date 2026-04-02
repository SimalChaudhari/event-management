import {
    PROGRAMME_LOADING,
    PROGRAMME_ERROR,
    PROGRAMME_TRACKS_LIST,
    PROGRAMME_SESSIONS_LIST,
    PROGRAMME_TRACK_SESSIONS_LIST,
    CREATE_PROGRAMME_TRACK,
    UPDATE_PROGRAMME_TRACK,
    DELETE_PROGRAMME_TRACK,
    CREATE_PROGRAMME_SESSION,
    UPDATE_PROGRAMME_SESSION,
    DELETE_PROGRAMME_SESSION,
    CLEAR_PROGRAMME_ERROR
} from '../constants/actionTypes';

const initialState = {
    tracks: [],
    sessions: [],
    trackSessions: {}, // Store sessions by trackId: { trackId1: [sessions], trackId2: [sessions] }
    loading: false,
    error: null,
};

const programmeReducer = (state = initialState, action) => {
    switch (action.type) {
        case PROGRAMME_LOADING:
            return {
                ...state,
                loading: action.payload,
            };
            
        case PROGRAMME_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false,
            };
            
        case CLEAR_PROGRAMME_ERROR:
            return {
                ...state,
                error: null,
            };
            
        case PROGRAMME_TRACKS_LIST:
            return {
                ...state,
                tracks: action.payload,
                loading: false,
                error: null,
            };
            
        case PROGRAMME_SESSIONS_LIST:
            return {
                ...state,
                sessions: action.payload,
                loading: false,
                error: null,
            };
            
        case PROGRAMME_TRACK_SESSIONS_LIST:
            return {
                ...state,
                trackSessions: {
                    ...state.trackSessions,
                    [action.payload.trackId]: action.payload.sessions
                },
                loading: false,
                error: null,
            };
            
        case CREATE_PROGRAMME_TRACK:
            return {
                ...state,
                tracks: [...state.tracks, action.payload],
                loading: false,
                error: null,
            };
            
        case UPDATE_PROGRAMME_TRACK:
            return {
                ...state,
                tracks: state.tracks.map((track) =>
                    track.id === action.payload.id ? action.payload : track
                ),
                loading: false,
                error: null,
            };
            
        case DELETE_PROGRAMME_TRACK:
            return {
                ...state,
                tracks: state.tracks.filter((track) => track.id !== action.payload),
                loading: false,
                error: null,
            };
            
        case CREATE_PROGRAMME_SESSION:
            // Add session to global sessions and to the appropriate track
            const newSession = action.payload;
            const updatedSessions = [...state.sessions, newSession];
            const updatedTrackSessionsCreate = { ...state.trackSessions };
            
            if (newSession.trackId && updatedTrackSessionsCreate[newSession.trackId]) {
                updatedTrackSessionsCreate[newSession.trackId] = [...updatedTrackSessionsCreate[newSession.trackId], newSession];
            }
            
            return {
                ...state,
                sessions: updatedSessions,
                trackSessions: updatedTrackSessionsCreate,
                loading: false,
                error: null,
            };
            
        case UPDATE_PROGRAMME_SESSION:
            // Update session in both global sessions and track-specific sessions
            const updatedSession = action.payload;
            const updatedSessionsUpdate = state.sessions.map((session) =>
                session.id === updatedSession.id ? updatedSession : session
            );
            const updatedTrackSessionsUpdate = { ...state.trackSessions };
            
            // Update in all track sessions where this session exists
            Object.keys(updatedTrackSessionsUpdate).forEach(trackId => {
                updatedTrackSessionsUpdate[trackId] = updatedTrackSessionsUpdate[trackId].map(
                    session => session.id === updatedSession.id ? updatedSession : session
                );
            });
            
            return {
                ...state,
                sessions: updatedSessionsUpdate,
                trackSessions: updatedTrackSessionsUpdate,
                loading: false,
                error: null,
            };
            
        case DELETE_PROGRAMME_SESSION:
            // Remove session from both global sessions and track-specific sessions
            const updatedTrackSessions = { ...state.trackSessions };
            Object.keys(updatedTrackSessions).forEach(trackId => {
                updatedTrackSessions[trackId] = updatedTrackSessions[trackId].filter(
                    session => session.id !== action.payload
                );
            });
            
            return {
                ...state,
                sessions: state.sessions.filter((session) => session.id !== action.payload),
                trackSessions: updatedTrackSessions,
                loading: false,
                error: null,
            };
            
        default:
            return state;
    }
};

export default programmeReducer;

