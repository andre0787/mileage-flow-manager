import { describe, it, expect, beforeEach } from "vitest";
import { renderFatalError, renderMissingRoot } from "../../src/main";

describe("src/main.tsx error rendering", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders fatal error safely using textContent (preventing XSS)", () => {
    const maliciousMsg = '<img src="x" onerror="alert(1)">';
    const error = new Error(maliciousMsg);

    renderFatalError(container, error);

    const scriptTags = container.querySelectorAll("script");
    const imgTags = container.querySelectorAll("img");
    expect(scriptTags.length).toBe(0);
    expect(imgTags.length).toBe(0);

    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain(maliciousMsg);

    // Verify raw HTML was not injected into innerHTML as tags
    expect(container.innerHTML).toContain("&lt;img src=\"x\" onerror=\"alert(1)\"&gt;");
  });

  it("renders missing root safely", () => {
    renderMissingRoot(container);

    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe("Erro: element #root não encontrado");
  });
});
