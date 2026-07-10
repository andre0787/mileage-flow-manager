import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force reload on new version (prevent stale service worker)
const APP_VERSION = "1.0.2";
const storedVersion = localStorage.getItem("mc-app-version");
if (storedVersion && storedVersion !== APP_VERSION) {
  localStorage.removeItem("mc-app-version");
  window.location.reload();
}
localStorage.setItem("mc-app-version", APP_VERSION);

// Global error handler — shows error on screen instead of black
window.onerror = (msg, src, line, col, err) => {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `<div style="padding:2rem;font-family:system-ui;max-width:600px;margin:0 auto">
      <h1 style="color:red">⚠️ Runtime Error</h1>
      <pre style="background:#f5f5f5;padding:1rem;border-radius:8px;overflow:auto">${msg}\n${src}:${line}:${col}\n${err?.stack || ""}</pre>
      <button onclick="localStorage.clear();sessionStorage.clear();window.location.reload()" style="margin-top:1rem;padding:0.5rem 1rem">Limpar cache e recarregar</button>
    </div>`;
  }
};

window.addEventListener("unhandledrejection", (e) => {
  console.error("[unhandledrejection]", e.reason);
});

const root = document.getElementById("root");
if (!root) {
  document.body.innerHTML = '<div style="padding:2rem;text-align:center"><h1>Erro: element #root não encontrado</h1></div>';
} else {
  try {
    createRoot(root).render(<App />);
  } catch (err) {
    console.error("[main] Fatal render error:", err);
    root.innerHTML = `<div style="padding:2rem;text-align:center;font-family:system-ui">
      <h1>Algo deu errado ao carregar o app</h1>
      <p>Tente limpar o cache do navegador (Ctrl+Shift+R)</p>
      <pre style="text-align:left;background:#f5f5f5;padding:1rem;border-radius:8px;margin-top:1rem;overflow:auto">${err instanceof Error ? err.message + "\n" + err.stack : String(err)}</pre>
    </div>`;
  }
}
