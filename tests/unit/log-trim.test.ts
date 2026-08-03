import { describe, expect, it } from "vitest";
import { splitAtLimit } from "../../scripts/lib/log-trim.mjs";

describe("log-trim splitAtLimit", () => {
  it("mantém as últimas max linhas e devolve o excesso como arquivado", () => {
    const result = splitAtLimit(["a", "b", "c", "d"], 2);

    expect(result.kept).toEqual(["c", "d"]);
    expect(result.archived).toEqual(["a", "b"]);
  });

  it("não arquiva nada quando está dentro do limite", () => {
    const result = splitAtLimit(["a", "b"], 5);

    expect(result.kept).toEqual(["a", "b"]);
    expect(result.archived).toEqual([]);
  });

  it("lida com limite zero e lista vazia", () => {
    expect(splitAtLimit([], 10)).toEqual({ kept: [], archived: [] });
    expect(splitAtLimit(["a"], 0)).toEqual({ kept: [], archived: ["a"] });
  });
});
