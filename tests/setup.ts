/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";

// Fallback env vars for testing environment if not set
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://test.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "test-anon-key";

// Polyfill matchMedia (jsdom não implementa) — usado por useIsMobile/shadcn
if (typeof window.matchMedia === "undefined") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Polyfill ResizeObserver for recharts in jsdom
if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
