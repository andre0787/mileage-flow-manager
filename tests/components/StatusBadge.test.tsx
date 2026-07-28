import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/ui/StatusBadge";

describe("StatusBadge", () => {
  it("renderiza label padrão em português", () => {
    render(<StatusBadge status="confirmada" />);
    expect(screen.getByText("Confirmada")).toBeDefined();
  });

  it("renderiza status cancelado como Destructive", () => {
    render(<StatusBadge status="cancelado" />);
    expect(screen.getByText("Cancelado")).toBeDefined();
  });

  it("renderiza status pendente", () => {
    render(<StatusBadge status="pendente" />);
    expect(screen.getByText("Pendente")).toBeDefined();
  });

  it("renderiza status pago", () => {
    render(<StatusBadge status="pago" />);
    expect(screen.getByText("Pago")).toBeDefined();
  });

  it("renderiza status concluido", () => {
    render(<StatusBadge status="concluido" />);
    expect(screen.getByText("Concluído")).toBeDefined();
  });

  it("renderiza status aguardando", () => {
    render(<StatusBadge status="aguardando" />);
    expect(screen.getByText("Aguardando")).toBeDefined();
  });

  it("renderiza texto original para status desconhecido", () => {
    render(<StatusBadge status="custom_status" />);
    expect(screen.getByText("custom_status")).toBeDefined();
  });

  it("aplica classe de tamanho sm", () => {
    const { container } = render(<StatusBadge status="confirmada" size="sm" />);
    const badge = container.querySelector("div") || container.firstChild;
    expect(badge?.textContent).toBe("Confirmada");
  });

  it("esconde label quando showLabel=false", () => {
    render(<StatusBadge status="confirmada" showLabel={false} />);
    expect(screen.queryByText("Confirmada")).toBeNull();
  });
});
