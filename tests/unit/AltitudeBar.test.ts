import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { render } from "@testing-library/react";
import { AltitudeBar } from "@/components/AltitudeBar";

describe("AltitudeBar", () => {
  it("renderiza barra com porcentagem proporcional", () => {
    const { container } = render(createElement(AltitudeBar, { value: 250000, goal: 500000 }));
    const fill = container.querySelector(".absolute.inset-y-0.left-0");
    expect(fill).not.toBeNull();
    expect(fill?.getAttribute("style")).toContain("width: 50%");
  });

  it("limita a 100% quando valor supera a meta", () => {
    const { container } = render(createElement(AltitudeBar, { value: 999999, goal: 500000 }));
    const fill = container.querySelector(".absolute.inset-y-0.left-0");
    expect(fill?.getAttribute("style")).toContain("width: 100%");
  });

  it("não exibe nada preenchido sem meta", () => {
    const { container } = render(createElement(AltitudeBar, { value: 100 }));
    const fill = container.querySelector(".absolute.inset-y-0.left-0");
    expect(fill?.getAttribute("style")).toContain("width: 0%");
  });

  it("aceita cor customizada", () => {
    const { container } = render(
      createElement(AltitudeBar, { value: 50, goal: 100, color: "red" }),
    );
    const fill = container.querySelector(".absolute.inset-y-0.left-0");
    expect(fill?.getAttribute("style")).toContain("background: red");
  });
});
