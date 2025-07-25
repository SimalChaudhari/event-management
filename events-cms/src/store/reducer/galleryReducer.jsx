import { GALLERY_LIST, GALLERY_BY_ID, ALL_GALLERIES } from "../constants/actionTypes";

const initialState = {
    galleryItems: [],
    allGalleries: [],
    galleryByEvent: null,
    selectedGallery: null,
};

const galleryReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case GALLERY_LIST:
            return {
                ...state,
                galleryItems: payload,
            };
        case ALL_GALLERIES:
            return {
                ...state,
                allGalleries: payload,
            };
        case GALLERY_BY_ID:
            return {
                ...state,
                galleryByEvent: payload,
            };
        default:
            return state;
    }
};

export default galleryReducer;
