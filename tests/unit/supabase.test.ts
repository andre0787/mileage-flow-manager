import { describe, expect, test, vi } from "vitest";
import { supabase } from "@/lib/supabase";

describe("supabase client initialization", () => {
  test("exports a valid Supabase client instance when env vars are present", () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.from).toBe("function");
  });

  test("throws an error when VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing", async () => {
    vi.resetModules();
    const originalUrl = import.meta.env.VITE_SUPABASE_URL;
    import.meta.env.VITE_SUPABASE_URL = "";

    await expect(import("@/lib/supabase")).rejects.toThrow(
      "Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.",
    );

    import.meta.env.VITE_SUPABASE_URL = originalUrl;
    vi.resetModules();
  });
});
