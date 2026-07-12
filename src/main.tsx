import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/theme.css";
import "./index.css";

import App from "./App";
import { registerPWA } from "./pwa";

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Uygulama başlangıç alanı bulunamadı."
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerPWA();