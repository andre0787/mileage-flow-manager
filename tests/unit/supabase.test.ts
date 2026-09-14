import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

describe("supabase client initialization", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("throws error when environment variables are missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    await expect(import("@/lib/supabase")).rejects.toThrow(
      "Missing required Supabase environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY",
    );
  });

  test("exports valid Supabase client when env vars are defined", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://xyz.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "dummy-anon-key");

    const { supabase } = await import("@/lib/supabase");

    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.from).toBe("function");
  });
});
