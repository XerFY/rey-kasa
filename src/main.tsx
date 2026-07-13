import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/theme.css";
import "./index.css";

import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
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
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);

registerPWA();

const minimumSplashDuration = 700;

function hideSplashScreen() {
  const splash =
    document.getElementById(
      "app-splash"
    );

  if (!splash) return;

  window.setTimeout(() => {
    splash.classList.add(
      "splash-hidden"
    );

    window.setTimeout(() => {
      splash.remove();
    }, 250);
  }, minimumSplashDuration);
}

if (
  document.readyState === "complete"
) {
  hideSplashScreen();
} else {
  window.addEventListener(
    "load",
    hideSplashScreen,
    {
      once: true,
    }
  );
}