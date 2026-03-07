import { combineReducers } from 'redux';
import authReducer from './authReducer';
import eventReducer from './eventReducer';
import bannerReducer from './bannerReducer';
import loadingReducer from './loadingReducer';

export default combineReducers({
  auth: authReducer,
  event: eventReducer,
  banner: bannerReducer,
  loading: loadingReducer,
});
