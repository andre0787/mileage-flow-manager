import { describe, expect, test } from "vitest";
import { supabase } from "@/lib/supabase";

describe("supabase client initialization", () => {
  test("exports a valid Supabase client instance", () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.from).toBe("function");
  });
});
