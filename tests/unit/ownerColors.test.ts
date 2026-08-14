import { describe, it, expect } from "vitest";
import {
  ownerColor,
  ownerColorSoft,
  ownerColorBorder,
  hashString,
  withAlpha,
  isValidHex,
  OWNER_COLOR_PALETTE,
} from "@/lib/ownerColors";

describe("hashString", () => {
  it("é estável entre chamadas", () => {
    expect(hashString("Fulano de Tal")).toBe(hashString("Fulano de Tal"));
  });

  it("é sensível a maiúsculas/caixa", () => {
    expect(hashString("Ana")).not.toBe(hashString("ana"));
  });
});

describe("ownerColor", () => {
  it("usa a cor customizada quando informada (precedência)", () => {
    expect(ownerColor("João Silva", "#ff0000")).toBe("#ff0000");
    expect(ownerColor("Ana", "#00ff00")).toBe("#00ff00");
  });

  it("ignora cor customizada inválida e cai no hash (fallback)", () => {
    const fallback = ownerColor("João Silva");
    expect(ownerColor("João Silva", "vermelho")).toBe(fallback);
    expect(ownerColor("João Silva", "#ff00")).toBe(fallback);
    expect(ownerColor("João Silva", null)).toBe(fallback);
    expect(ownerColor("João Silva", undefined)).toBe(fallback);
    expect(ownerColor("João Silva", "")).toBe(fallback);
  });

  it("retorna a mesma cor para o mesmo nome (determinístico)", () => {
    expect(ownerColor("João Silva")).toBe(ownerColor("João Silva"));
  });

  it("é case-insensitive (mesmo dono com caixas diferentes)", () => {
    expect(ownerColor("MARIA")).toBe(ownerColor("maria"));
  });

  it("nomes distintos mapeiam para cores da paleta", () => {
    const names = [
      "Ana",
      "Bruno",
      "Carla",
      "Diego",
      "Elisa",
      "Fábio",
      "Gabriela",
      "Hugo",
      "Íris",
      "João",
      "Karla",
      "Luís",
      "Marta",
      "Nuno",
      "Olga",
      "Paulo",
    ];
    for (const name of names) {
      const color = ownerColor(name);
      expect(OWNER_COLOR_PALETTE).toContain(color);
    }
  });

  it("nome vazio cai na primeira cor da paleta", () => {
    expect(ownerColor("")).toBe(OWNER_COLOR_PALETTE[0]);
    expect(ownerColor("   ")).toBe(OWNER_COLOR_PALETTE[0]);
  });
});

describe("paleta (contraste entre cores)", () => {
  it("tem cores com distância perceptiva mínima entre vizinhas", () => {
    // Distância Euclidiana no espaço RGB ≥ 65 entre qualquer par — evita
    // vizinhanças confusas (dois donos com azuis quase idênticos). 65 é o
    // limite realista para 12 cores saturadas variando matiz e luminância.
    const parse = (hex: string) => {
      const v = parseInt(hex.slice(1), 16);
      return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
    };
    const rgb = OWNER_COLOR_PALETTE.map(parse);
    for (let i = 0; i < rgb.length; i++) {
      for (let j = i + 1; j < rgb.length; j++) {
        const d = Math.sqrt(
          (rgb[i][0] - rgb[j][0]) ** 2 +
            (rgb[i][1] - rgb[j][1]) ** 2 +
            (rgb[i][2] - rgb[j][2]) ** 2,
        );
        expect(d).toBeGreaterThanOrEqual(65);
      }
    }
  });

  it("tem pelo menos 12 cores (diversidade para múltiplos donos)", () => {
    expect(OWNER_COLOR_PALETTE.length).toBeGreaterThanOrEqual(12);
    expect(new Set(OWNER_COLOR_PALETTE).size).toBe(OWNER_COLOR_PALETTE.length);
  });
});

describe("isValidHex", () => {
  it("aceita apenas hex #rrggbb", () => {
    expect(isValidHex("#ff0000")).toBe(true);
    expect(isValidHex("#FF0000")).toBe(true);
    expect(isValidHex("#000000")).toBe(true);
    expect(isValidHex("red")).toBe(false);
    expect(isValidHex("#ff00")).toBe(false);
    expect(isValidHex("#fff")).toBe(false);
    expect(isValidHex(null)).toBe(false);
    expect(isValidHex(undefined)).toBe(false);
  });
});

describe("withAlpha / soft / border", () => {
  it("converte hex para rgba com alpha", () => {
    expect(withAlpha("#5B72C4", 0.5)).toBe("rgba(91,114,196,0.5)");
  });

  it("ownerColorSoft usa alpha ~13%", () => {
    expect(ownerColorSoft("Ana")).toMatch(/^rgba\(\d+,\d+,\d+,0\.13\)$/);
  });

  it("ownerColorBorder usa alpha ~50%", () => {
    expect(ownerColorBorder("Ana")).toMatch(/^rgba\(\d+,\d+,\d+,0\.5\)$/);
  });

  it("compartilha a cor base do dono", () => {
    const c = ownerColor("Ana");
    const hex = /^#([0-9a-f]{6})$/i.exec(c)?.[1];
    const v = parseInt(hex ?? "000000", 16);
    const rgb = `${(v >> 16) & 0xff},${(v >> 8) & 0xff},${v & 0xff}`;
    expect(ownerColorSoft("Ana")).toBe(`rgba(${rgb},0.13)`);
    expect(ownerColorBorder("Ana")).toBe(`rgba(${rgb},0.5)`);
  });

  it("soft/border usam a cor customizada com precedência", () => {
    expect(ownerColorSoft("Ana", "#ff0000")).toBe("rgba(255,0,0,0.13)");
    expect(ownerColorBorder("Ana", "#ff0000")).toBe("rgba(255,0,0,0.5)");
  });
});
