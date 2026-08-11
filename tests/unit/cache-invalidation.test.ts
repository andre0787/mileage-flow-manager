import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const MUTATION_FILES = [
  "src/hooks/useDatabase/origemTypes.ts",
  "src/hooks/useDatabase/programs.ts",
  "src/hooks/useDatabase/shared.ts",
];

// Domínios migrados para RTK Query (Blueprint v4.0 P1) invalidam cache via
// baseApi.util.invalidateTags nos wrappers de compat — mesma garantia de
// refetch, outro mecanismo.
const RTK_QUERY_FILES = [
  "src/features/entradas/mutationHooksBasic.ts",
  "src/features/entradas/mutationHooksLifecycle.ts",
  "src/features/contas/mutationHooksBasic.ts",
  "src/features/contas/mutationHooksLifecycle.ts",
];
const CLIENTS_RTK_FILES = [
  "src/features/clientes/addClient.ts",
  "src/features/clientes/updateClient.ts",
  "src/features/clientes/deleteClient.ts",
];
const VENDAS_RTK_FILES = [
  "src/features/vendas/mutationHooksBasic.ts",
  "src/features/vendas/mutationHooksLifecycle.ts",
  "src/features/vendas/addVenda.ts",
  "src/features/vendas/updateVenda.ts",
  "src/features/vendas/deleteVenda.ts",
  "src/features/vendas/cancelVenda.ts",
];
const OWNERS_RTK_FILES = [
  "src/features/owners/mutationHooksLifecycle.ts",
  "src/features/owners/addOwner.ts",
  "src/features/owners/updateOwner.ts",
  "src/features/owners/deleteOwner.ts",
];

describe("atualização do cache após mutations", () => {
  it("aguarda o refetch antes de concluir cada callback de sucesso", () => {
    for (const relativePath of MUTATION_FILES) {
      const source = readFileSync(resolve(ROOT, relativePath), "utf8");
      const callbacks = [...source.matchAll(/onSuccess:\s*(async\s*)?\([^)]*\)\s*=>/g)];

      expect(callbacks.length, relativePath).toBeGreaterThan(0);
      expect(
        callbacks.every((match) => Boolean(match[1])),
        relativePath,
      ).toBe(true);
      expect(source, relativePath).toMatch(/await (?:Promise\.all\(\[)?[\s\S]*?invalidateQueries/);
    }
  });

  it("invalida tags entries/accounts nos wrappers RTK Query migrados", () => {
    for (const relativePath of RTK_QUERY_FILES) {
      const source = readFileSync(resolve(ROOT, relativePath), "utf8");
      expect(source, relativePath).toMatch(/invalidateTags\((?:INVALIDATE|ACCOUNT_TAGS)\)/);
      expect(source, relativePath).toMatch(/["']entries["']/);
      expect(source, relativePath).toMatch(/["']accounts["']/);
    }
  });

  it("declara invalidação de clients nos endpoints RTK Query migrados", () => {
    for (const relativePath of CLIENTS_RTK_FILES) {
      const source = readFileSync(resolve(ROOT, relativePath), "utf8");
      expect(source, relativePath).toMatch(/invalidatesTags:/);
      expect(source, relativePath).toMatch(/["']clients["']/);
    }
  });

  it("invalida sales/accounts nos wrappers e endpoints de vendas migrados", () => {
    for (const relativePath of VENDAS_RTK_FILES) {
      const source = readFileSync(resolve(ROOT, relativePath), "utf8");
      expect(source, relativePath).toMatch(/sales/);
      expect(source, relativePath).toMatch(/accounts/);
    }
  });

  it("invalida owners nos wrappers e endpoints de owners migrados", () => {
    for (const relativePath of OWNERS_RTK_FILES) {
      const source = readFileSync(resolve(ROOT, relativePath), "utf8");
      expect(source, relativePath).toMatch(/owners/);
    }
    const lifecycle = readFileSync(
      resolve(ROOT, "src/features/owners/mutationHooksLifecycle.ts"),
      "utf8",
    );
    expect(lifecycle).toMatch(/invalidateTags\((?:INVALIDATE)\)/);
    const endpoints = ["addOwner", "updateOwner", "deleteOwner"]
      .map((n) =>
        readFileSync(resolve(ROOT, `src/features/owners/${n}.ts`), "utf8"),
      )
      .join("\n");
    expect(endpoints.match(/invalidatesTags: \["owners"\]/g)).toHaveLength(3);
  });
});
