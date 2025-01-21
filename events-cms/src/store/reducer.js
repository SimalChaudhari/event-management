import { combineReducers } from 'redux';
import { createSelectorHook } from 'react-redux';
import ableReducer from './ableReducer';
import demoReducer from './demoReducer';
const reducer = combineReducers({
    able: ableReducer,
    demo: demoReducer
});
export const useSelector = createSelectorHook();
export default reducer;
