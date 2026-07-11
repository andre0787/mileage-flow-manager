#!/usr/bin/env node

/**
 * lib.mjs — Utilitários compartilhados entre scripts.
 *
 * Uso: import { git, ok, err, warn, run, ROOT } from "./lib.mjs";
 *
 * ponytail: sem dependências, funções puras.
 */

import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "..");

export function git(cmd) {
  try { return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 5000 }).trim(); }
  catch { return ""; }
}

export function gitLong(cmd, timeout = 60000) {
  try { return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout }).trim(); }
  catch { return ""; }
}

export function ok(msg) {
  console.log(`  ✅ ${msg}`);
  return true;
}

export function err(msg) {
  console.log(`  ❌ ${msg}`);
  return false;
}

export function warn(msg) {
  console.log(`  ⚠️  ${msg}`);
  return false;
}

export function run(cmd, label) {
  try {
    gitLong(cmd);
    ok(label);
    return true;
  } catch (e) {
    err(`${label}: ${e.stderr?.slice(0, 200) || e.message}`);
    return false;
  }
}

/**
 * Retorna { branch, prNum, today } — informações comuns do repositório.
 */
export function repoInfo() {
  const branch = git("git rev-parse --abbrev-ref HEAD");
  let prNum = null;
  try {
    const out = git(`gh pr list --head "${branch}" --json number 2>/dev/null`);
    if (out) {
      const list = JSON.parse(out);
      if (list.length > 0) prNum = list[0].number;
    }
  } catch {}
  const today = new Date().toISOString().slice(0, 10);
  return { branch, prNum, today };
}
