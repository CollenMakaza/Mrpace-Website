import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import App from "./App.jsx";
import { AdminAuthProvider } from "./AdminAuth.jsx";
import "./base.css";
import "./admin.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>
);
