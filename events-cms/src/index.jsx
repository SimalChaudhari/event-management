import React from 'react';
import ReactDOM from 'react-dom/client'; // Updated for React 18
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App/index';
import * as serviceWorker from './serviceWorker';
import config from './config';
import './assets/scss/style.scss';
import store from './store/store';

// Get the root element from the DOM
const rootElement = document.getElementById('root');

// Create the root using ReactDOM.createRoot
const root = ReactDOM.createRoot(rootElement);

// Render the application
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter basename={config.basename}>
                <App />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);

// Service worker setup (optional)
serviceWorker.unregister(); // Change to register() if you want offline support
