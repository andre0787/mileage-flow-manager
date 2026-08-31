import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useHaptic } from "@/hooks/useHaptic";

describe("useHaptic", () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("chama navigator.vibrate(10) para feedback light", () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(globalThis, "navigator", {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true,
    });

    const haptic = useHaptic();
    haptic.light();

    expect(vibrateMock).toHaveBeenCalledTimes(1);
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it("chama navigator.vibrate(20) para feedback medium", () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(globalThis, "navigator", {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true,
    });

    const haptic = useHaptic();
    haptic.medium();

    expect(vibrateMock).toHaveBeenCalledTimes(1);
    expect(vibrateMock).toHaveBeenCalledWith(20);
  });

  it("chama navigator.vibrate([30, 50, 30]) para feedback heavy", () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(globalThis, "navigator", {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true,
    });

    const haptic = useHaptic();
    haptic.heavy();

    expect(vibrateMock).toHaveBeenCalledTimes(1);
    expect(vibrateMock).toHaveBeenCalledWith([30, 50, 30]);
  });

  it("chama navigator.vibrate([10, 30, 10]) para feedback success", () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(globalThis, "navigator", {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true,
    });

    const haptic = useHaptic();
    haptic.success();

    expect(vibrateMock).toHaveBeenCalledTimes(1);
    expect(vibrateMock).toHaveBeenCalledWith([10, 30, 10]);
  });

  it("trata navegadores sem suporte a navigator.vibrate de forma silenciosa", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });

    const haptic = useHaptic();
    expect(() => {
      haptic.light();
      haptic.medium();
      haptic.heavy();
      haptic.success();
    }).not.toThrow();
  });

  it("trata erros lançados por navigator.vibrate de forma silenciosa", () => {
    const vibrateMock = vi.fn().mockImplementation(() => {
      throw new Error("Vibration restricted by user gesture");
    });
    Object.defineProperty(globalThis, "navigator", {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true,
    });

    const haptic = useHaptic();
    expect(() => {
      haptic.light();
      haptic.medium();
      haptic.heavy();
      haptic.success();
    }).not.toThrow();

    expect(vibrateMock).toHaveBeenCalledTimes(4);
  });
});
