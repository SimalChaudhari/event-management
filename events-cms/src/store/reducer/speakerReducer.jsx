import { SPEAKER_LIST } from '../constants/actionTypes';

const initialState = {
    speaker: []
};
const speakerReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case SPEAKER_LIST:
            return {
                ...state,
                speaker: payload
            };

        default:
            return state;
    }
};
export default speakerReducer;
