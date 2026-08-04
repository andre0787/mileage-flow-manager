import { describe, it, expect } from "vitest";
import { toggleSort, sortByKey, type SortState } from "@/lib/sort";

interface Row {
  id: string;
  date: string;
  amount: number;
  name: string;
}

const rows: Row[] = [
  { id: "a", date: "2026-08-01", amount: 10, name: "Bravo" },
  { id: "b", date: "2026-07-15", amount: 5, name: "alpha" },
  { id: "c", date: "2026-08-10", amount: 20, name: "Charlie" },
];

describe("toggleSort", () => {
  it("cria asc ao clicar em coluna nova", () => {
    expect(toggleSort(null, "date")).toEqual({ key: "date", dir: "asc" });
  });

  it("alterna asc → desc ao clicar na mesma coluna", () => {
    const current: SortState = { key: "date", dir: "asc" };
    expect(toggleSort(current, "date")).toEqual({ key: "date", dir: "desc" });
  });

  it("alterna desc → asc", () => {
    const current: SortState = { key: "date", dir: "desc" };
    expect(toggleSort(current, "date")).toEqual({ key: "date", dir: "asc" });
  });

  it("troca de coluna e volta para asc", () => {
    const current: SortState = { key: "amount", dir: "desc" };
    expect(toggleSort(current, "name")).toEqual({ key: "name", dir: "asc" });
  });
});

describe("sortByKey", () => {
  it("não muta o array original", () => {
    const before = rows.map((r) => r.id).join(",");
    sortByKey(rows, "amount", "asc");
    expect(rows.map((r) => r.id).join(",")).toBe(before);
  });

  it("ordena números asc", () => {
    const result = sortByKey(rows, "amount", "asc");
    expect(result.map((r) => r.amount)).toEqual([5, 10, 20]);
  });

  it("ordena números desc", () => {
    const result = sortByKey(rows, "amount", "desc");
    expect(result.map((r) => r.amount)).toEqual([20, 10, 5]);
  });

  it("ordena datas string asc (comparação lexical ISO)", () => {
    const result = sortByKey(rows, "date", "asc");
    expect(result.map((r) => r.date)).toEqual(["2026-07-15", "2026-08-01", "2026-08-10"]);
  });

  it("ordena strings com localeCompare pt-BR", () => {
    const result = sortByKey(rows, "name", "asc");
    expect(result[0].name).toBe("alpha"); // localeCompare ignora maiúscula
  });

  it("usa getValue para extrair valor comparável", () => {
    const result = sortByKey(rows, "date", "desc", (r) => new Date(r.date).getTime());
    expect(result.map((r) => r.id)).toEqual(["c", "a", "b"]);
  });

  it("retorna cópia mesmo quando ordem já é a mesma", () => {
    const result = sortByKey(rows, "amount", "asc");
    expect(result).not.toBe(rows);
  });
});
