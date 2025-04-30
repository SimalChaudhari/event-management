import { combineReducers } from 'redux';
import ableReducer from './ableReducer';
import demoReducer from './demoReducer';
import authReducer from './reducer/authReducer';
import userReducer from './reducer/userReducer';
import eventReducer from './reducer/eventReducer';
import orderReducer from './reducer/orderReducer';
import withdrawReducer from './reducer/withdrawReducer';
const reducer = combineReducers({
    able: ableReducer,
    demo: demoReducer,
    auth: authReducer,
    user: userReducer,
    event: eventReducer,
    orders: orderReducer,
    withdraw: withdrawReducer
});
// export const useSelector = createSelectorHook();
export default reducer;
