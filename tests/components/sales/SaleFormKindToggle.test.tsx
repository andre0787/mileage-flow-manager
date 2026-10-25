import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SaleFormKindToggle } from "@/components/sales/form/SaleFormKindToggle";

describe("SaleFormKindToggle", () => {
  it("renders both Milhas and Serviço options with correct active variant", () => {
    const onSwitchKind = vi.fn();
    render(<SaleFormKindToggle kind="milhas" mode="create" onSwitchKind={onSwitchKind} />);

    const milhasBtn = screen.getByRole("button", { name: "Milhas" });
    const servicoBtn = screen.getByRole("button", { name: "Serviço" });

    expect(milhasBtn).toBeInTheDocument();
    expect(servicoBtn).toBeInTheDocument();
    expect(milhasBtn).not.toBeDisabled();
    expect(servicoBtn).not.toBeDisabled();
  });

  it("disables buttons when in edit mode", () => {
    const onSwitchKind = vi.fn();
    render(<SaleFormKindToggle kind="milhas" mode="edit" onSwitchKind={onSwitchKind} />);

    const milhasBtn = screen.getByRole("button", { name: "Milhas" });
    const servicoBtn = screen.getByRole("button", { name: "Serviço" });

    expect(milhasBtn).toBeDisabled();
    expect(servicoBtn).toBeDisabled();
  });

  it("calls onSwitchKind when option is clicked", () => {
    const onSwitchKind = vi.fn();
    render(<SaleFormKindToggle kind="milhas" mode="create" onSwitchKind={onSwitchKind} />);

    const servicoBtn = screen.getByRole("button", { name: "Serviço" });
    fireEvent.click(servicoBtn);

    expect(onSwitchKind).toHaveBeenCalledWith("servico");
  });
});
