// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import { FilterResultsProvider } from "./context/FilterResultsContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Si despliegas en subpath, habilita basename:
        <BrowserRouter basename="/powerball"> */}
    <FilterResultsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </FilterResultsProvider>
  </React.StrictMode>
);
