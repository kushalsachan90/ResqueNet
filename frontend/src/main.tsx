// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { SosProvider } from "./context/SocketContext.tsx"; // Context import kiya
import "./index.css";

export const API_URL = "http://localhost:3000/apiGateway/user/accepted";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
 
      <SosProvider> 
        <App />
      </SosProvider>
    </BrowserRouter>
  </React.StrictMode>
);