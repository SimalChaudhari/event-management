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
import couponReducer from './reducer/couponReducer';
import settingsReducer from './reducer/settingsReducer';
import withdrawReducer from './reducer/withdrawReducer';
import surveyReducer from './reducer/surveyReducer';
import qaReducer from './reducer/qaReducer';
import pollingReducer from './reducer/pollingReducer';
import logsReducer from './reducer/logsReducer';
import programmeReducer from './reducer/programmeReducer';
import engagementReducer from './reducer/engagementReducer';
import engagementQnaReducer from './reducer/engagementQnaReducer';
import moderatorReducer from './reducer/moderatorReducer';
import pushNotificationReducer from './reducer/pushNotificationReducer.jsx';
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
    coupon: couponReducer,
    settings: settingsReducer,
    withdraw: withdrawReducer,
    survey: surveyReducer,
    qa: qaReducer,
    polling: pollingReducer,
    logs: logsReducer,
    programme: programmeReducer,
    engagement: engagementReducer,
    engagementQna: engagementQnaReducer,
    moderator: moderatorReducer,
    pushNotification: pushNotificationReducer,
    loading: loadingReducer,
    error: errorReducer
});

export default reducer;
