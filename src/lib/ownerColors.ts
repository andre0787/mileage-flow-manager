/**
 * ownerColors.ts — Cores por dono de conta (visualização por cor).
 *
 * Cada dono recebe uma cor: a CUSTOMIZADA (campo `owners.color`, hex) quando
 * informada, ou a derivada deterministicamente do NOME (hash FNV-1a sobre
 * paleta fixa) como fallback. A cor é um reforço visual: o nome do dono
 * continua sempre renderizado ao lado.
 *
 * Uso:
 *   ownerColor("Fulano")                  → "#4361EE" (fallback por hash)
 *   ownerColor("Fulano", "#ff0000")       → "#ff0000" (custom tem precedência)
 *   ownerColorSoft("Fulano")              → "rgba(67,97,238,0.13)" (fundo suave)
 *   ownerColorBorder("Fulano", "#ff0000") → "rgba(255,0,0,0.5)" (borda)
 *
 * regra-31: lib com teste unitário (tests/unit/ownerColors.test.ts)
 */

/**
 * Paleta fixa curada — 12 cores com distância perceptiva mínima entre si
 * (seleção greedy sobre candidatos variando matiz E luminância), em vez de
 * `hsl(hash % 360)` que gera cores feias e vizinhanças confusas. Hex sólido.
 */
export const OWNER_COLOR_PALETTE = [
  "#4361EE", // índigo
  "#EA580C", // laranja
  "#22C55E", // verde
  "#F472B6", // rosa claro
  "#3F6212", // oliva
  "#84CC16", // verde-claro
  "#9D174D", // magenta
  "#1E3A8A", // azul-marinho
  "#A21CAF", // fúcsia
  "#60A5FA", // azul-claro
  "#6D28D9", // violeta
  "#134E4A", // teal escuro
] as const;

/** Hex válido (#rrggbb)? Usado para aceitar apenas cores customizadas válidas. */
export function isValidHex(hex: string | null | undefined): hex is string {
  return typeof hex === "string" && /^#[0-9a-f]{6}$/i.test(hex.trim());
}

/** Hash FNV-1a 32-bit (estável entre plataformas/Node/browser). */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Cor sólida do dono (hex). `customColor` (hex válido) tem precedência;
 * sem ela, deriva por hash do nome. Nomes vazios caem no índice 0.
 */
export function ownerColor(name: string, customColor?: string | null): string {
  if (isValidHex(customColor)) return customColor.trim();
  const n = (name ?? "").trim();
  if (!n) return OWNER_COLOR_PALETTE[0];
  return OWNER_COLOR_PALETTE[hashString(n.toLowerCase()) % OWNER_COLOR_PALETTE.length];
}

/** Hex → "rgba(r,g,b,alpha)". Útil para fundos/bordas com opacidade. */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const v = parseInt(m[1], 16);
  const r = (v >> 16) & 0xff;
  const g = (v >> 8) & 0xff;
  const b = v & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Fundo suave do dono (alpha ~13%) para chips/badges. */
export function ownerColorSoft(name: string, customColor?: string | null): string {
  return withAlpha(ownerColor(name, customColor), 0.13);
}

/** Borda do dono (alpha ~50%) para destaques de card/linha. */
export function ownerColorBorder(name: string, customColor?: string | null): string {
  return withAlpha(ownerColor(name, customColor), 0.5);
}
