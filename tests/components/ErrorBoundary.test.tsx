import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const BuggyComponent = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    localStorage.clear();
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Content Normal</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Content Normal")).toBeInTheDocument();
  });

  it("catches errors and does NOT store sensitive error details in localStorage", () => {
    const sensitiveErrorMessage = "SENSITIVE_USER_TOKEN_SECRET_12345";

    render(
      <ErrorBoundary>
        <BuggyComponent message={sensitiveErrorMessage} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Verify localStorage has not stored any sensitive error boundary data
    expect(localStorage.getItem("mc_error_boundary")).toBeNull();
  });

  it("renders custom fallback when provided without storing data in localStorage", () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <BuggyComponent message="Some error" />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom Error UI")).toBeInTheDocument();
    expect(localStorage.getItem("mc_error_boundary")).toBeNull();
  });
});
