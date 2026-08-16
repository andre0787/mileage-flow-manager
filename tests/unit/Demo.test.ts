import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Demo from "@/pages/Demo";

// Página demo: com env desabilitada, mostra a tela de aviso (P12.5-02
// desligamento imediato). O fluxo completo com fixture é coberto pelo E2E
// real (tests/demo-e2e.spec.ts, npm run test:e2e:demo).
vi.stubGlobal("import.meta", { env: { VITE_PUBLIC_DEMO_ENABLED: "false" } });

describe("Página Demo", () => {
  beforeEach(() => {
    vi.stubGlobal("import.meta", { env: { VITE_PUBLIC_DEMO_ENABLED: "false" } });
  });

  it("com demo desabilitado mostra aviso e não o dashboard", () => {
    render(
      createElement(MemoryRouter, null, createElement(Demo)),
    );
    expect(screen.getByText(/Demo indisponível/i)).toBeTruthy();
    expect(screen.queryByText(/Dashboard demo/i)).toBeNull();
  });
});
