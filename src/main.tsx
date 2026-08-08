import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./manager-shell";
import "./delegation-controls";
import "./manager-delegation-enforcement";
import "./remove-legacy-delegations";
import "./noleggio-sso";
import "./design-system/tokens.css";
import "./design-system/components.css";
import "./os/lab/os-lab.css";
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
