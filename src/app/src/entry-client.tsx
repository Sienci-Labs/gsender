import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import App from "./App";

ReactDOM.hydrateRoot(
    document.getElementById("app") as HTMLElement,
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
