import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntryForm } from "@/components/EntryForm";

describe("EntryForm", () => {
  it("inicia a recorrência na data da entrada e preserva uma edição manual", () => {
    const { container } = render(
      <EntryForm
        type="pontos"
        mode="create"
        accounts={[]}
        origemTypes={[]}
        programs={[]}
        owners={[]}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const dateInputs = () =>
      Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));

    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2025-09-15" } });
    fireEvent.click(screen.getByRole("checkbox"));
    expect(dateInputs()[1].value).toBe("2025-09-15");

    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2025-09-20" } });
    expect(dateInputs()[1].value).toBe("2025-09-20");

    fireEvent.change(dateInputs()[1], { target: { value: "2025-10-01" } });
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2025-09-25" } });
    expect(dateInputs()[1].value).toBe("2025-10-01");
  });
});
