import { describe, expect, it } from "vitest";
import { renderFatalError, renderMissingRoot } from "@/lib/mainErrorFallback";

describe("renderFatalError", () => {
  it("limpa o container e mostra título, dica e detalhes do Error", () => {
    const container = document.createElement("div");
    container.textContent = "conteúdo antigo";

    const err = new Error("falha simulada");
    renderFatalError(container, err);

    expect(container.querySelector("h1")?.textContent).toBe("Algo deu errado ao carregar o app");
    expect(container.querySelector("p")?.textContent).toContain("Ctrl+Shift+R");
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toContain("falha simulada");
    expect(container.textContent).not.toContain("conteúdo antigo");
  });

  it("serializa erro não-Error com String()", () => {
    const container = document.createElement("div");

    renderFatalError(container, "pane simples");

    expect(container.querySelector("pre")?.textContent).toBe("pane simples");
  });
});

describe("renderMissingRoot", () => {
  it("limpa o container e mostra o erro de #root ausente", () => {
    const container = document.createElement("div");
    container.textContent = "conteúdo antigo";

    renderMissingRoot(container);

    expect(container.querySelector("h1")?.textContent).toBe("Erro: element #root não encontrado");
    expect(container.textContent).not.toContain("conteúdo antigo");
  });
});
