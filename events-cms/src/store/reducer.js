import { combineReducers } from 'redux';
import { createSelectorHook } from 'react-redux';
import ableReducer from './ableReducer';
import demoReducer from './demoReducer';
import authReducer from './reducer/authReducer';
import userReducer from './reducer/userReducer';
const reducer = combineReducers({
    able: ableReducer,
    demo: demoReducer,
    auth: authReducer,
    user: userReducer
});
export const useSelector = createSelectorHook();
export default reducer;
