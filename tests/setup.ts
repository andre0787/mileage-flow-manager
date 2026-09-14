/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";

// Fallback env vars for testing environment if not set.
// Setamos em process.env E import.meta.env: o cliente Supabase lê
// import.meta.env, enquanto parte do tooling/testes lê process.env.
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://test.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "test-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL) {
  import.meta.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  import.meta.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
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
