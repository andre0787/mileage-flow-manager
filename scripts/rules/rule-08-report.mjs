#!/usr/bin/env node

/**
 * rule-08-report.mjs — Verifica regra #8: relatório HTML existe antes do PR.
 *
 * Valida:
 * 1. Relatório existe com PR no nome: docs/reports/<data>/PR<num>-*.html
 * 2. Relatório contém seções obrigatórias (Benefícios, Impacto Negócio, Breakdown, Checklist)
 * 3. Nomenclatura segue padrão <prefixo>-YYYY-MM-DD-<nome>.html
 *
 * Uso: node scripts/rules/rule-08-report.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { git, ok, err, warn, repoInfo, ROOT } from "../lib.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";

const { branch, prNum, today } = repoInfo();

// Se não tem PR, não é possível validar relatório com prefixo PR
// Mas ainda verifica se existe algum relatório na data
if (!prNum) {
  warn("branch sem PR — verificando relatório genérico");
  const anyReport = git(`ls docs/reports/${today}/*.html 2>/dev/null || true`);
  if (!anyReport || !anyReport.trim()) {
    err(`nenhum relatório encontrado em docs/reports/${today}/ (regra #8)`);
    err("  Toda alteração DEVE ter relatório HTML antes do PR");
    err("  Dica: npm run report \"descrição\" --write");
    process.exit(1);
  }
  ok(`relatório encontrado: docs/reports/${today}/ (regra #8)`);
  process.exit(0);
}

// 1. Relatório existe com PR no nome
const reportGlob = `docs/reports/${today}/PR${prNum}-*.html`;
const report = git(`ls ${reportGlob} 2>/dev/null`);
if (!report) {
  err(`relatório não encontrado: ${reportGlob} (regra #8)`);
  err("  Dica: npm run report \"descrição\" --write");
  process.exit(1);
}
ok(`relatório encontrado: docs/reports/${today}/ (regra #8)`);

// 2. Valida nomenclatura
const reportFile = report.trim().split("\n")[0];
if (reportFile) {
  const filename = reportFile.split("/").pop() || "";
  // Padrão: PR<num>-YYYY-MM-DD-<nome>.html
  const pattern = new RegExp(`^PR${prNum}-\\d{4}-\\d{2}-\\d{2}-.+\\.html$`);
  if (!pattern.test(filename)) {
    err(`nomenclatura do relatório inválida: ${filename}`);
    err(`  Esperado: PR${prNum}-YYYY-MM-DD-<nome>.html`);
    process.exit(1);
  }
  ok(`nomenclatura do relatório OK: ${filename}`);
}

// 3. Valida seções obrigatórias
if (reportFile) {
  const content = readFileSync(resolve(ROOT, reportFile), "utf8");

  const requiredSections = [
    { name: "🎯 Benefícios", marker: "Benefícios" },
    { name: "✅ Checklist de Revisão", marker: "Checklist de Revisão" },
    { name: "📸 Evidências", marker: "Evidências" },
    { name: "⚡ Consumo de Tokens", marker: "Consumo de Tokens" },
    { name: "📊 Métricas", marker: "Métricas" },
    { name: "Breakdown", marker: "Breakdown" },
  ];

  let allOk = true;
  for (const section of requiredSections) {
    if (content.includes(section.marker)) {
      ok(`seção "${section.name}" presente`);
    } else {
      err(`seção "${section.name}" ausente no relatório`);
      allOk = false;
    }
  }

  if (!allOk) process.exit(1);
}

ok("relatório completo e válido ✅");
