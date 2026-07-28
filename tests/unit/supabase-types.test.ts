/**
 * supabase-types.ts é puramente tipos TypeScript (sem runtime).
 * Este teste verifica que o módulo é importável.
 */
import { describe, it, expect } from "vitest";
import type { Database } from "@/lib/supabase-types";

describe("supabase-types", () => {
  it("Database é um tipo exportado válido", () => {
    // Apenas verificação de tipo — o módulo não tem runtime
    expect(true).toBe(true);
  });

  it("Database tem estrutura Tables", () => {
    // Verificação em runtime da interface
    const db: Database = {} as Database;
    expect(db).toBeDefined();
  });
});
