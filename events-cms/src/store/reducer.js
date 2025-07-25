import { combineReducers } from 'redux';
import ableReducer from './ableReducer';
import demoReducer from './demoReducer';
import authReducer from './reducer/authReducer';
import userReducer from './reducer/userReducer';
import eventReducer from './reducer/eventReducer';
import orderReducer from './reducer/orderReducer';
import withdrawReducer from './reducer/withdrawReducer';
import speakerReducer from './reducer/speakerReducer';
import settingsReducer from './reducer/settingsReducer';
import bannerReducer from './reducer/bannerReducer';
import categoryReducer from './reducer/categoryReducer';
import galleryReducer from './reducer/galleryReducer';

const reducer = combineReducers({
    able: ableReducer,
    demo: demoReducer,
    auth: authReducer,
    user: userReducer,
    event: eventReducer,
    orders: orderReducer,
    withdraw: withdrawReducer,
    speaker: speakerReducer,
    settings: settingsReducer,
    banner: bannerReducer,
    category: categoryReducer,
    gallery: galleryReducer
});

export default reducer;
