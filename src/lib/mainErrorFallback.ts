export function renderFatalError(container: HTMLElement, error: unknown) {
  container.textContent = "";

  const wrapper = document.createElement("div");
  wrapper.style.padding = "2rem";
  wrapper.style.textAlign = "center";
  wrapper.style.fontFamily = "system-ui";

  const title = document.createElement("h1");
  title.textContent = "Algo deu errado ao carregar o app";

  const subtitle = document.createElement("p");
  subtitle.textContent = "Tente limpar o cache do navegador (Ctrl+Shift+R)";

  const errorDetails = document.createElement("pre");
  errorDetails.style.textAlign = "left";
  errorDetails.style.background = "#f5f5f5";
  errorDetails.style.padding = "1rem";
  errorDetails.style.borderRadius = "8px";
  errorDetails.style.marginTop = "1rem";
  errorDetails.style.overflow = "auto";
  errorDetails.textContent =
    error instanceof Error ? error.message + "\n" + error.stack : String(error);

  wrapper.appendChild(title);
  wrapper.appendChild(subtitle);
  wrapper.appendChild(errorDetails);

  container.appendChild(wrapper);
}

export function renderMissingRoot(container: HTMLElement) {
  container.textContent = "";

  const wrapper = document.createElement("div");
  wrapper.style.padding = "2rem";
  wrapper.style.textAlign = "center";

  const title = document.createElement("h1");
  title.textContent = "Erro: element #root não encontrado";

  wrapper.appendChild(title);
  container.appendChild(wrapper);
}
