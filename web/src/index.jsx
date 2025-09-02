import React from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import axios from "axios";
import { register } from "register-service-worker";
import App from "./App";

import "./sass/zoneweaver.scss";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import "@fortawesome/fontawesome-free/css/brands.css";
import "@fortawesome/fontawesome-free/css/regular.css";
import "@fortawesome/fontawesome-free/css/solid.css";

axios.defaults.withCredentials = true;

console.log(`${__APP_NAME__ || 'Zoneweaver'} ${__APP_VERSION__ || '1.0.0'}`);

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  register('/ui/sw.js', {
    registrationOptions: { scope: '/ui/' },
    ready(registration) {
      console.log('Service worker is active.');
    },
    registered(registration) {
      console.log('Service worker has been registered.');
    },
    cached(registration) {
      console.log('Content has been cached for offline use.');
    },
    updatefound(registration) {
      console.log('New content is downloading.');
    },
    updated(registration) {
      console.log('New content is available; please refresh.');
      // You could show a toast notification here asking user to refresh
    },
    offline() {
      console.log('No internet connection found. App is running in offline mode.');
    },
    error(error) {
      console.error('Error during service worker registration:', error);
    }
  });
}

// CRITICAL, CRITICAL, CRITICAL, DO NOT EVER FUCKING REMOVE THIS!
// React.StrictMode is ESSENTIAL for proper React development
// It helps catch bugs early and enforces best practices
// DO NOT REMOVE IT EVEN IF IT CAUSES TERMINAL ISSUES
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// CRITICAL, CRITICAL, CRITICAL, DO NOT EVER FUCKING REMOVE THIS!

reportWebVitals();
