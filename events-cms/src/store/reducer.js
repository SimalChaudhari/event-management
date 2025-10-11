import { combineReducers } from 'redux';
import authReducer from './reducer/authReducer';
import userReducer from './reducer/userReducer';
import eventReducer from './reducer/eventReducer';
import orderReducer from './reducer/orderReducer';
import speakerReducer from './reducer/speakerReducer';
import exhibitorReducer from './reducer/exhibitorReducer';
import bannerReducer from './reducer/bannerReducer';
import galleryReducer from './reducer/galleryReducer';
import categoryReducer from './reducer/categoryReducer';
import settingsReducer from './reducer/settingsReducer';
import withdrawReducer from './reducer/withdrawReducer';
import surveyReducer from './reducer/surveyReducer';
import qaReducer from './reducer/qaReducer';
import pollingReducer from './reducer/pollingReducer';
import logsReducer from './reducer/logsReducer';
import programmeReducer from './reducer/programmeReducer';
import loadingReducer from './reducer/loadingReducer';
import errorReducer from './reducer/errorReducer';
import ableReducer from './ableReducer';
import demoReducer from './demoReducer';

const reducer = combineReducers({
    able: ableReducer,
    demo: demoReducer,
    
    auth: authReducer,
    user: userReducer,
    event: eventReducer,
    order: orderReducer,
    speaker: speakerReducer,
    exhibitor: exhibitorReducer,
    banner: bannerReducer,
    gallery: galleryReducer,
    category: categoryReducer,
    settings: settingsReducer,
    withdraw: withdrawReducer,
    survey: surveyReducer,
    qa: qaReducer,
    polling: pollingReducer,
    logs: logsReducer,
    programme: programmeReducer,
    loading: loadingReducer,
    error: errorReducer
});

export default reducer;
