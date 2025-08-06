import React from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import axios from "axios";
import App from "./App";

import "./sass/zoneweaver.scss";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import "@fortawesome/fontawesome-free/css/brands.css";
import "@fortawesome/fontawesome-free/css/regular.css";
import "@fortawesome/fontawesome-free/css/solid.css";

axios.defaults.withCredentials = true;

console.log(`${__APP_NAME__ || 'ZoneWeaver'} ${__APP_VERSION__ || '1.0.0'}`);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
