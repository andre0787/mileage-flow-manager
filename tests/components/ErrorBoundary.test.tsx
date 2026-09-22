import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const BuggyComponent = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    localStorage.clear();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    localStorage.clear();
    process.env.NODE_ENV = originalEnv;
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

  it("resets error state when clicking 'Tentar Novamente'", () => {
    let shouldThrow = true;
    const ConditionalBuggyComponent = () => {
      if (shouldThrow) {
        throw new Error("Temporary error");
      }
      return <div>Recovered Content</div>;
    };

    render(
      <ErrorBoundary>
        <ConditionalBuggyComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText("Tentar Novamente"));

    expect(screen.getByText("Recovered Content")).toBeInTheDocument();
    expect(screen.queryByText("Algo deu errado")).not.toBeInTheDocument();
  });

  it("triggers window.location.reload when clicking 'Recarregar Página'", () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: reloadSpy },
    });

    render(
      <ErrorBoundary>
        <BuggyComponent message="Page crash" />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByText("Recarregar Página"));
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("displays error details in development mode", () => {
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <BuggyComponent message="Detailed dev error description" />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Detalhes do erro (dev)")).toBeInTheDocument();
    expect(screen.getByText(/Detailed dev error description/)).toBeInTheDocument();
  });
});
