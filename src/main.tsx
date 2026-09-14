import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { renderFatalError, renderMissingRoot } from "./lib/mainErrorFallback";

// Force reload on new version (prevent stale service worker)
const APP_VERSION = "1.0.3";
const storedVersion = localStorage.getItem("mc-app-version");
if (storedVersion && storedVersion !== APP_VERSION) {
  localStorage.removeItem("mc-app-version");
  window.location.reload();
}
localStorage.setItem("mc-app-version", APP_VERSION);

const root = document.getElementById("root");
if (!root) {
  renderMissingRoot(document.body);
} else {
  try {
    createRoot(root).render(<App />);
  } catch (err) {
    console.error("[main] Fatal render error:", err);
    renderFatalError(root, err);
  }
}
