#!/usr/bin/env node
/**
 * rtk-benefits-sim.mjs — Simulação de cenário de teste do RTK.
 *
 * Executa comandos reais do workflow MilesControl com e sem RTK e mede:
 * - bytes de saída bruta vs. saída reescrita (rtk rewrite)
 * - estimativa de tokens economizados (heurística chars/4)
 * - overhead de tempo
 *
 * Contrato rtk rewrite: exit 0 = rewrite; exit 1 = pass-through;
 * exit 3 = rewrite (advisory). execSync lança em exit != 0, então o
 * stdout do rewrite está em error.stdout — capturar, não cair no catch.
 *
 * ponytail: fs + execSync nativo, zero deps
 */

import { execSync } from "child_process";

const RTK = `${process.env.HOME}/.local/bin/rtk`;

/** Roda um comando e retorna stdout; "" se falhar */
function runRaw(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout: 15000, cwd: process.cwd() }).toString();
  } catch (e) {
    return (e.stdout || "").toString();
  }
}

/** Pede o rewrite ao rtk; retorna o comando reescrito ou null (pass-through) */
function rtkRewrite(cmd) {
  try {
    const out = execSync(`"${RTK}" rewrite "${cmd.replace(/"/g, '\\"')}"`, {
      encoding: "utf8",
      timeout: 15000,
    }).toString();
    return out.trim() || null;
  } catch (e) {
    // exit 1 = sem rewrite; exit 3 = rewrite advisory (stdout no erro)
    const out = (e.stdout || "").toString().trim();
    return out || null;
  }
}

/** Executa o comando como o pi faria: rewrite → executa o reescrito */
function runRtk(cmd) {
  const rewritten = rtkRewrite(cmd);
  if (!rewritten || rewritten === cmd) return runRaw(cmd);
  return runRaw(rewritten);
}

function estTokens(chars) {
  return Math.round(chars / 4);
}

function ms(fn) {
  const t0 = process.hrtime.bigint();
  fn();
  return Number(process.hrtime.bigint() - t0) / 1e6;
}

// ─── Cenário: comandos típicos do workflow ─────────────────────────
const commands = [
  ["git status", "git status"],
  ["git status -v", "git status -v"],
  ["git log --oneline -20", "git log --oneline -20"],
  ["git log -p -5", "git log -p -5"],
  ["git diff --stat", "git diff --stat"],
  ["ls -la", "ls -la"],
  ["cat package.json", "cat package.json"],
  ["grep -rn console.warn scripts/rules --include=*.mjs | head -5", "grep -rn console.warn scripts/rules --include=*.mjs | head -5"],
];

console.log("🧪 SIMULAÇÃO RTK — cenário de teste (comandos reais MilesControl)\n");
console.log("Comando | raw chars | rtk chars | economia % | raw tok | rtk tok | tok econom. | overhead rtk (ms)");
console.log("--------|-----------|-----------|------------|---------|---------|-------------|------------------");

const results = [];
for (const [label, cmd] of commands) {
  const rawOut = runRaw(cmd);
  const rtkOut = runRtk(cmd);
  const rawChars = rawOut.length;
  const rtkChars = rtkOut.length;
  const saving = rawChars > 0 ? Math.round(((rawChars - rtkChars) / rawChars) * 100) : 0;
  const rawTok = estTokens(rawChars);
  const rtkTok = estTokens(rtkChars);
  const tokSaved = rawTok - rtkTok;
  const rtkMs = ms(() => runRtk(cmd));

  results.push({ label, rawChars, rtkChars, saving, rawTok, rtkTok, tokSaved, rtkMs });
  console.log(
    `${label} | ${rawChars} | ${rtkChars} | ${saving}% | ${rawTok} | ${rtkTok} | ${tokSaved} | ${rtkMs.toFixed(1)}ms`
  );
}

// ─── Resumo ────────────────────────────────────────────────────────
const totalRaw = results.reduce((a, r) => a + r.rawChars, 0);
const totalRtk = results.reduce((a, r) => a + r.rtkChars, 0);
const totalTokRaw = results.reduce((a, r) => a + r.rawTok, 0);
const totalTokRtk = results.reduce((a, r) => a + r.rtkTok, 0);
const avgSaving = Math.round(results.reduce((a, r) => a + r.saving, 0) / results.length);

console.log("\n📊 RESUMO");
console.log(`Bytes: ${totalRaw} → ${totalRtk} (economia ${Math.round(((totalRaw - totalRtk) / totalRaw) * 100)}%)`);
console.log(
  `Tokens estimados (chars/4): ${totalTokRaw} → ${totalTokRtk} (economia ${Math.round(
    ((totalTokRaw - totalTokRtk) / totalTokRaw) * 100
  )}%)`
);
console.log(`Economia média por comando: ${avgSaving}% | Overhead médio rtk: ${(results.reduce((a, r) => a + r.rtkMs, 0) / results.length).toFixed(1)}ms`);
