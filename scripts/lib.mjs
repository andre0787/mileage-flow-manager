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
export const ROOT = process.env.MOCK_ROOT || resolve(__dirname, "..");

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
  if (process.env.REPO_INFO_MOCK_BRANCH !== undefined) {
    return {
      branch: process.env.REPO_INFO_MOCK_BRANCH,
      prNum: process.env.REPO_INFO_MOCK_PR ? parseInt(process.env.REPO_INFO_MOCK_PR, 10) : null,
      today: process.env.REPO_INFO_MOCK_TODAY || new Date().toISOString().slice(0, 10)
    };
  }
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

/**
 * Retorna lista de arquivos modificados (histórico da branch em relação a main + working tree, staged e untracked).
 */
export function getDiffFiles() {
  if (process.env.PRE_PR_MOCK_DIFF !== undefined) {
    return process.env.PRE_PR_MOCK_DIFF.split(",").filter(Boolean);
  }
  const files = new Set();
  const baseBranch = "main";
  
  try {
    const currentBranch = git("git rev-parse --abbrev-ref HEAD");
    if (currentBranch && currentBranch !== baseBranch) {
      let mergeBase = git(`git merge-base ${baseBranch} HEAD`);
      if (!mergeBase) {
        mergeBase = git(`git merge-base origin/${baseBranch} HEAD`);
      }
      const ref = mergeBase ? `${mergeBase}...HEAD` : `${baseBranch}...HEAD`;
      const diffBaseHead = git(`git diff ${ref} --name-only`);
      if (diffBaseHead) {
        diffBaseHead.split("\n").map(f => f.trim()).filter(Boolean).forEach(f => files.add(f));
      }
    }
  } catch {}

  try {
    const diffWorking = git("git diff HEAD --name-only");
    if (diffWorking) {
      diffWorking.split("\n").map(f => f.trim()).filter(Boolean).forEach(f => files.add(f));
    }
  } catch {}

  try {
    const statusOut = git("git status --porcelain");
    if (statusOut) {
      statusOut.split("\n").forEach(line => {
        if (line.startsWith("?? ")) {
          files.add(line.slice(3).trim());
        }
      });
    }
  } catch {}

  return Array.from(files);
}
