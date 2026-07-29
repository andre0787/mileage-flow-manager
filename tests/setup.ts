/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";

// Polyfill ResizeObserver for recharts in jsdom
if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
