import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntryForm } from "@/components/EntryForm";
import type { Account } from "@/types";

const account = (id: string, type: "pontos" | "milhas"): Account => ({
  id,
  name: `Conta ${id}`,
  ownerId: "owner-1",
  programId: "prog-1",
  type,
  balance: 1000,
  status: "ativa",
  createdAt: "2026-01-01",
});

const accounts: Account[] = [account("acc-pontos", "pontos"), account("acc-milhas", "milhas")];

function renderForm(mode: "create" | "edit" = "create", initial?: { accountId?: string }) {
  return render(
    <EntryForm
      type="pontos"
      mode={mode}
      initialData={initial}
      accounts={accounts}
      origemTypes={[]}
      programs={[]}
      owners={[]}
      onSubmit={vi.fn()}
      onCancel={vi.fn()}
    />,
  );
}

describe("EntryForm — toggle Pontos/Milhas no próprio form", () => {
  it("exibe o toggle no modo create e troca o label de quantidade", () => {
    renderForm();
    expect(screen.getByText("Tipo do registro:")).toBeTruthy();
    expect(screen.getByText("Pontos Adquiridos")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Milhas" }));
    expect(screen.getByText("Milhas Adquiridos")).toBeTruthy();
    expect(screen.queryByText("Pontos Adquiridos")).toBeNull();
  });

  it("trocar o tipo limpa a conta selecionada (conta é específica por tipo)", () => {
    const { container } = renderForm("create", { accountId: "acc-pontos" });
    // Conta pré-selecionada aparece no SelectValue
    expect(container.textContent).toContain("Conta acc-pontos");
    fireEvent.click(screen.getByRole("button", { name: "Milhas" }));
    // Conta é específica por tipo — volta ao placeholder ao trocar
    expect(container.textContent).toContain("Selecione a conta");
    expect(container.textContent).not.toContain("Conta acc-pontos");
  });

  it("toggle não aparece no modo edição (tipo fixo da conta original)", () => {
    renderForm("edit", { accountId: "acc-milhas" });
    expect(screen.queryByText("Tipo do registro:")).toBeNull();
    // Tipo derivado da conta original (milhas)
    expect(screen.getByText("Milhas Adquiridos")).toBeTruthy();
  });

  it("toggle não troca nada ao clicar no tipo já ativo", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Pontos" }));
    expect(screen.getByText("Pontos Adquiridos")).toBeTruthy();
  });
});
