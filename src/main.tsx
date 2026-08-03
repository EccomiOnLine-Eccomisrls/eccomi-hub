import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./design-system/tokens.css";
import "./design-system/components.css";
import "./index.css";
import "./executive-home.css";
import "./command-center-v2.css";
import "./brand-logo.css";
import "./eccomi-os-2.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
