/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";

// Ensure Supabase environment variables are defined during testing if not already set
if (!import.meta.env.VITE_SUPABASE_URL) {
  import.meta.env.VITE_SUPABASE_URL = "https://mock.supabase.co";
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  import.meta.env.VITE_SUPABASE_ANON_KEY = "mock-anon-key";
}

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
