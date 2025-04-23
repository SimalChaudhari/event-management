import { createStore, applyMiddleware, combineReducers } from 'redux';
import { thunk } from 'redux-thunk'; // Correctly import `thunk`
import { composeWithDevTools } from 'redux-devtools-extension'; // Import Redux DevTools
import reducer from './reducer';

// Create the Redux store with the combined reducer, middleware, and Redux DevTools
const store = createStore(
  reducer,
  composeWithDevTools(applyMiddleware(thunk)) // Integrate DevTools with thunk middleware
);

export default store;

