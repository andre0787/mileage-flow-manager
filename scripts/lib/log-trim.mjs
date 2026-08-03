/**
 * log-trim.mjs — Divisão pura de logs por limite, preservando histórico.
 *
 * Em vez de descartar as linhas mais antigas quando um log ultrapassa um
 * limite (o que apagava eventos históricos), splitAtLimit devolve as linhas
 * mantidas e as arquivadas; o chamador decide onde persistir o archive.
 *
 * ponytail: função pura, zero deps, sem acesso a filesystem.
 */

/**
 * @param {string[]} lines
 * @param {number} max
 * @returns {{ kept: string[], archived: string[] }}
 */
export function splitAtLimit(lines, max) {
  const safeLines = Array.isArray(lines) ? lines : [];
  const limit = Number.isInteger(max) && max >= 0 ? max : 0;
  if (safeLines.length <= limit) return { kept: [...safeLines], archived: [] };
  const splitAt = safeLines.length - limit;
  return {
    kept: safeLines.slice(splitAt),
    archived: safeLines.slice(0, splitAt),
  };
}