#!/usr/bin/env node

/**
 * rule-37-rtk.mjs — Valida a integração RTK no workflow (github.com/rtk-ai/rtk).
 *
 * Verifica:
 * - Extensão Pi `.pi/extensions/rtk.ts` presente (versionada no repo);
 * - `rtk --version` >= 0.23.0 quando o binário estiver no PATH;
 * - Ausência do binário local → skip não-falho (fail-open, CI amigável).
 *
 * Regra #37: "Integração RTK ativa — extensão versionada + versão mínima"
 *
 * ponytail: fs + execSync nativo, zero deps
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const EXTENSION_PATH = resolve(ROOT, ".pi/extensions/rtk.ts");
const MIN_SUPPORTED = [0, 23, 0];

function getBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
  } catch { return "?"; }
}

/** Compara [major, minor, patch]; retorna true se a >= b */
function gte(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return true;
}

function getRtkVersion() {
  try {
    const out = execSync("rtk --version", { encoding: "utf8", timeout: 5000 }).trim();
    const m = out.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!m) return null;
    return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  } catch {
    return null;
  }
}

function main() {
  const branch = getBranch();
  if (branch === "main" || branch === "master") {
    console.log("  ⏭️  rule-37: main/master — regra não se aplica");
    return;
  }

  if (!existsSync(EXTENSION_PATH)) {
    console.error("❌ rule-37: extensão .pi/extensions/rtk.ts não encontrada.");
    console.error("   Execute `rtk init --agent pi` e commite o arquivo gerado.");
    console.error("   Referência: docs/council/2026-08-08-rtk-integration-veredito.md");
    process.exit(1);
  }
  console.log("  ✅ rule-37: extensão .pi/extensions/rtk.ts presente");

  const ver = getRtkVersion();
  if (!ver) {
    console.log("  ⏭️  rule-37: rtk não encontrado no PATH — skip não-falho (fail-open; instale via install.sh ou cargo)");
    return;
  }

  if (!gte(ver, MIN_SUPPORTED)) {
    console.error(`❌ rule-37: rtk ${ver.join(".")} é antigo — mínimo exigido ${MIN_SUPPORTED.join(".")}.`);
    console.error("   Atualize: curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh");
    process.exit(1);
  }
  console.log(`  ✅ rule-37: rtk ${ver.join(".")} >= ${MIN_SUPPORTED.join(".")}`);
}

main();
