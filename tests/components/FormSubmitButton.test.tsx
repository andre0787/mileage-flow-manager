import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormSubmitButton } from "../../src/components/FormSubmitButton";

describe("FormSubmitButton", () => {
  it("renderiza children com type=submit dentro de um form", () => {
    render(
      <form>
        <FormSubmitButton>Registrar</FormSubmitButton>
      </form>,
    );
    const btn = screen.getByRole("button", { name: "Registrar" });
    expect(btn).toBeTruthy();
    expect(btn.getAttribute("type")).toBe("submit");
    expect(btn.hasAttribute("disabled")).toBe(false);
  });

  it("aceita pendingLabel e className", () => {
    render(
      <form>
        <FormSubmitButton pendingLabel="Enviando..." className="bg-red-500">
          Ok
        </FormSubmitButton>
      </form>,
    );
    const btn = screen.getByRole("button", { name: "Ok" });
    expect(btn.className).toContain("bg-red-500");
  });
});
