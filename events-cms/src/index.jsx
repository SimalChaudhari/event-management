import React from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import ReactDOM from 'react-dom/client'; // Updated for React 18
import { Provider } from 'react-redux';
import App from './App/index';
import * as serviceWorker from './serviceWorker';
import './assets/scss/style.scss';
import store from './store/store';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  
        <Provider store={store}>
        <App />
        </Provider>
 
);

// Service worker setup (optional)
serviceWorker.unregister(); // Change to register() if you want offline support
