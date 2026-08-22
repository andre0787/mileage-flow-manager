/**
 * report-cli.mjs — Parsing de arguments para o gerador de briefing executivo.
 *
 * Funções puras: parseArgs() retorna objeto imutável com todas as flags.
 * Acesso direto a process.argv para valores de conveniência.
 *
 * zero deps (só process.argv + path/url)
 */

import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");

// ── collectArgs (multi-word flags) ──────────────────────────────────
/**
 * Coleta todos os valores até o próximo --flag.
 * Ex: --summary "foo bar" → "foo bar"
 */
export function collectArgs(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return "";
  const parts = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (process.argv[i].startsWith("--")) break;
    parts.push(process.argv[i]);
  }
  return parts.join("\n");
}

// ── single-value flags ─────────────────────────────────────────────
function flagValue(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] || null : null;
}

function flagIndex(flag) {
  return process.argv.indexOf(flag);
}

// ── parseArgs ───────────────────────────────────────────────────────
/**
 * Parseia process.argv em objeto imutável com todas as flags do CLI.
 */
export function parseArgs(argv = process.argv) {
  const task = argv[2] || "auto";
  const write = argv.includes("--write");
  const diffBase = flagValue("--diff-base") || null;
  const reportDate = flagValue("--date") || null;
  const summary = collectArgs("--summary");
  const impactProduto = collectArgs("--impact-produto") || collectArgs("--benefits");
  const impactNegocio = collectArgs("--impact-negocio") || collectArgs("--impact");
  const impactProcesso = collectArgs("--impact-processo");
  const evidenceUrl = collectArgs("--evidence");
  const beforeText = collectArgs("--before");
  const afterText = collectArgs("--after");
  const renameTarget = flagValue("--rename");
  const prefix = flagValue("--prefix") || "auto";

  const testsIdx = flagIndex("--tests");
  const testsFlag =
    testsIdx !== -1 ? parseInt(argv[testsIdx + 1], 10) || null : null;

  // Rows da tabela: pipe-separated: item|correcao|beneficio|impacto_negocio|custo_token
  const rowsIdx = flagIndex("--rows");
  const tableRows = [];
  if (rowsIdx !== -1) {
    for (let i = rowsIdx + 1; i < argv.length; i++) {
      if (argv[i].startsWith("--")) break;
      const parts = argv[i].split("|").map((s) => s.trim());
      if (parts.length >= 5) {
        tableRows.push({
          item: parts[0],
          fix: parts[1],
          benefit: parts[2],
          impact: parts[3],
          tokens: parts[4],
        });
      }
    }
  }

  return {
    task,
    prefix,
    write,
    diffBase,
    reportDate,
    summary,
    impactProduto,
    impactNegocio,
    impactProcesso,
    evidenceUrl,
    beforeText,
    afterText,
    testsFlag,
    tableRows,
    renameTarget,
  };
}

// ── Conveniências (acesso rápido sem parseArgs) ─────────────────────


export const DIFF_BASE = flagValue("--diff-base") || null;
export const REPORT_DATE = flagValue("--date") || null;
export const PREFIX = flagValue("--prefix") || "auto";
export const HELP = process.argv.includes("--help") || process.argv.includes("-h");

/** Mostra ajuda e encerra. */
export function showHelp() {
  console.log(`
Uso: node scripts/generate-report.mjs [descrição] [flags]

Flags:
  --write              Salva em docs/reports/<data>/
  --prefix <prefixo>   Prefixo (PR<num>, fix, feat, docs, chore, auto)
  --summary <texto>    Frase de decisão (BLUF)
  --impact-produto <texto>  Impacto para o usuário final (produto)
  --impact-negocio <texto>  Impacto de negócio (tempo/risco/custo evitado)
  --impact-processo <texto> Impacto no processo de desenvolvimento
  --rows <linha>       Tabela: item|correção|benefício|impacto|token
  --diff-base <ref>    Base do diff (padrão: merge-base com origin/main)
  --date YYYY-MM-DD    Data dos eventos/telemetria
  --evidence <URL>     URL de screenshot
  --tests <N>          Total de testes
  --rename PR<num>     Renomeia relatórios para prefixo PR<num>
  --help, -h           Mostra esta ajuda
`);
  process.exit(0);
}

export { ROOT };
