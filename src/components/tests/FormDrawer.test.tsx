import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormDrawer } from "@/components/FormDrawer";

const mockIsMobile = vi.fn();
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => mockIsMobile(),
}));

describe("FormDrawer", () => {
  beforeEach(() => {
    mockIsMobile.mockReset();
    mockIsMobile.mockReturnValue(false);
  });

  it("renderiza título e children quando aberto (desktop)", () => {
    render(
      <FormDrawer open onOpenChange={() => {}} title="Cadastrar Novo Cliente">
        <input aria-label="campo-teste" />
      </FormDrawer>,
    );
    expect(screen.getByText("Cadastrar Novo Cliente")).toBeDefined();
    expect(screen.getByLabelText("campo-teste")).toBeDefined();
  });

  it("não renderiza conteúdo quando fechado", () => {
    render(
      <FormDrawer open={false} onOpenChange={() => {}} title="Título Oculto">
        <input aria-label="campo-oculto" />
      </FormDrawer>,
    );
    expect(screen.queryByText("Título Oculto")).toBeNull();
    expect(screen.queryByLabelText("campo-oculto")).toBeNull();
  });

  it("renderiza descrição quando fornecida", () => {
    render(
      <FormDrawer open onOpenChange={() => {}} title="Nova Entrada" description="Preencha os dados">
        <div />
      </FormDrawer>,
    );
    expect(screen.getByText("Preencha os dados")).toBeDefined();
  });
});
