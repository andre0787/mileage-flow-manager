import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EntryDateField } from "@/components/entry/EntryDateField";

describe("EntryDateField", () => {
  it("renders label and date input with value", () => {
    render(<EntryDateField date="2025-01-15" onChange={() => {}} />);

    const input = screen.getByLabelText("Data") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("2025-01-15");
  });

  it("calls onChange when input value changes", () => {
    const handleChange = vi.fn();
    render(<EntryDateField date="2025-01-15" onChange={handleChange} />);

    const input = screen.getByLabelText("Data");
    fireEvent.change(input, { target: { value: "2025-02-01" } });

    expect(handleChange).toHaveBeenCalledWith("2025-02-01");
  });

  it("displays error message when provided", () => {
    render(
      <EntryDateField
        date="2025-01-15"
        error="Data é obrigatória"
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("Data é obrigatória")).toBeInTheDocument();
  });
});
