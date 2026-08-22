import { describe, expect, it } from "vitest";
import { DEFAULT_SOURCES, getDefaultSourceUrl } from "@/ai/mutation/promotion/source-registry";

describe("promotion source registry", () => {
  it("usa domínio oficial da Azul, nunca domínio da GOL", () => {
    const azul = DEFAULT_SOURCES.find((source) => source.sourceId === "azul-fidelidade-official");

    expect(azul?.officialUrl).toContain("voeazul.com.br");
    expect(azul?.officialUrl).not.toContain("voegol.com.br");
  });

  it("expõe lookup centralizado de URL por programa", () => {
    expect(getDefaultSourceUrl("Azul Fidelidade")).toContain("voeazul.com.br");
    expect(getDefaultSourceUrl("Programa inexistente")).toBeUndefined();
  });
});
