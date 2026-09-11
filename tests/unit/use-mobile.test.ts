import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

describe("useIsMobile", () => {
  let originalInnerWidth: number;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  const setupMatchMediaMock = (queryMatches = false) => {
    const listeners = new Set<(e?: Event) => void>();

    const addEventListener = vi.fn((event: string, cb: (e?: Event) => void) => {
      if (event === "change") {
        listeners.add(cb);
      }
    });

    const removeEventListener = vi.fn((event: string, cb: (e?: Event) => void) => {
      if (event === "change") {
        listeners.delete(cb);
      }
    });

    const mql = {
      matches: queryMatches,
      media: "(max-width: 767px)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener,
      removeEventListener,
      dispatchEvent: vi.fn(),
    };

    const matchMediaMock = vi.fn().mockImplementation(() => mql);
    window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;

    const triggerChange = () => {
      listeners.forEach((cb) => cb());
    };

    return { mql, matchMediaMock, listeners, triggerChange };
  };

  it("retorna true quando a largura da janela é menor que 768px (mobile)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
    setupMatchMediaMock(true);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("retorna false quando a largura da janela é maior ou igual a 768px (desktop/tablet)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    setupMatchMediaMock(false);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Testar exatamente no breakpoint (768px)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768,
    });
    const { result: breakpointResult } = renderHook(() => useIsMobile());

    expect(breakpointResult.current).toBe(false);
  });

  it("chama window.matchMedia com a media query correta (max-width: 767px)", () => {
    const { matchMediaMock } = setupMatchMediaMock();

    renderHook(() => useIsMobile());

    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("atualiza o estado dinamicamente ao disparar o evento 'change'", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    const { triggerChange } = setupMatchMediaMock(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Redimensiona janela para mobile e dispara o evento de mudança
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    act(() => {
      triggerChange();
    });

    expect(result.current).toBe(true);

    // Redimensiona janela de volta para desktop
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    act(() => {
      triggerChange();
    });

    expect(result.current).toBe(false);
  });

  it("remove o listener do event listener de change ao desmontar o hook", () => {
    const { mql } = setupMatchMediaMock();

    const { unmount } = renderHook(() => useIsMobile());

    expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
