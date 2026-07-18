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

import { git, ok, err, warn, repoInfo, ROOT, getDiffFiles } from "../lib.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";

const { branch, prNum } = repoInfo();
const changedFiles = getDiffFiles();

// Filtra relatórios HTML existentes no diff
const reportFiles = changedFiles.filter(f => /^docs\/reports\/.*\.html$/.test(f));

if (reportFiles.length === 0) {
  err(`nenhum relatório encontrado no diff (regra #8)`);
  err("  Toda alteração DEVE ter relatório HTML antes do PR");
  err("  Dica: npm run report \"descrição\" --write");
  process.exit(1);
}

const prefix = prNum ? `PR${prNum}` : null;

// 1. Validar cada relatório no diff
let hasValidReport = false;
for (const reportFile of reportFiles) {
  const filename = reportFile.split("/").pop() || "";
  
  if (prefix) {
    // 2. Se temos PR, valida nomenclatura com prefixo
    // Padrão: PR<num>-YYYY-MM-DD-<nome>.html
    const pattern = new RegExp(`^PR${prNum}-\\d{4}-\\d{2}-\\d{2}-.+\\.html$`);
    if (!pattern.test(filename)) {
      err(`nomenclatura do relatório inválida no diff: ${filename}`);
      err(`  Esperado: PR${prNum}-YYYY-MM-DD-<nome>.html`);
      process.exit(1);
    }
  } else {
    // Se não há PR, aceita formato de branch ou genérico, mas precisa de data válida
    // Padrão: <prefixo>-YYYY-MM-DD-<nome>.html
    const pattern = /^[a-zA-Z0-9_-]+-\d{4}-\d{2}-\d{2}-.+\.html$/;
    if (!pattern.test(filename)) {
      err(`nomenclatura do relatório inválida no diff: ${filename}`);
      err(`  Esperado: <prefixo>-YYYY-MM-DD-<nome>.html`);
      process.exit(1);
    }
  }

  // 3. Valida seções obrigatórias
  const content = readFileSync(resolve(ROOT, reportFile), "utf8");

  const requiredSections = [
    { name: "🎯 Benefícios", marker: "Benefícios" },
    { name: "✅ Checklist de Revisão", marker: "Checklist de Revisão" },
    { name: "📸 Evidências", marker: "Evidências" },
    { name: "⚡ Consumo de Tokens", marker: "Consumo de Tokens" },
    { name: "📊 Métricas", marker: "Métricas" },
    { name: "Breakdown", marker: "Breakdown" },
  ];

  let allSectionsOk = true;
  for (const section of requiredSections) {
    if (content.includes(section.marker)) {
      ok(`seção "${section.name}" presente em ${filename}`);
    } else {
      err(`seção "${section.name}" ausente no relatório ${filename}`);
      allSectionsOk = false;
    }
  }

  if (allSectionsOk) {
    hasValidReport = true;
  }
}

if (!hasValidReport) {
  err("Nenhum de seus arquivos de relatório no diff é válido.");
  process.exit(1);
}

ok("relatório completo e válido ✅");
