import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import NotFound from "../../src/pages/NotFound";

describe("NotFound Page", () => {
  it("renders 404 heading, message, and return link", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "404" })).toBeDefined();
    expect(screen.getByText("Oops! Page not found")).toBeDefined();
    const link = screen.getByRole("link", { name: "Return to Home" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/");
  });
});
