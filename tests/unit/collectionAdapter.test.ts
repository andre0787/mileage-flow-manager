import { describe, expect, it } from "vitest";
import { createCollectionAdapter } from "@/lib/collectionAdapter";

interface Item {
  id: string;
  name: string;
}

const rows: Item[] = [
  { id: "a", name: "Alfa" },
  { id: "b", name: "Bravo" },
  { id: "c", name: "Charlie" },
];

const { toEntityState, selectAll, selectById, selectEntities, selectIds } =
  createCollectionAdapter<Item>();

describe("createCollectionAdapter", () => {
  it("normaliza array → { ids, entities } preservando ordem", () => {
    const state = toEntityState(rows);
    expect(state.ids).toEqual(["a", "b", "c"]);
    expect(state.entities).toEqual({
      a: { id: "a", name: "Alfa" },
      b: { id: "b", name: "Bravo" },
      c: { id: "c", name: "Charlie" },
    });
  });

  it("seletores: selectAll devolve array, selectById acha em O(1)", () => {
    const state = toEntityState(rows);
    expect(selectAll(state)).toEqual(rows);
    expect(selectById(state, "b")).toEqual({ id: "b", name: "Bravo" });
    expect(selectById(state, "nao-existe")).toBeUndefined();
  });

  it("selectEntities/selectIds expõem o mapa e os ids", () => {
    const state = toEntityState(rows);
    expect(Object.keys(selectEntities(state))).toHaveLength(3);
    expect(selectIds(state)).toEqual(["a", "b", "c"]);
  });

  it("estado vazio → array vazio e lookup undefined", () => {
    const state = toEntityState([]);
    expect(selectAll(state)).toEqual([]);
    expect(selectById(state, "a")).toBeUndefined();
  });
});
