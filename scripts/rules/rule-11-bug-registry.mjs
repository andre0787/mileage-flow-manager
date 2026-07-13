#!/usr/bin/env node

/**
 * rule-11-bug-registry.mjs — Verifica regra #11: bugs registrados em AGENDA.md.
 *
 * Se o diff staged contém alterações em src/ (código), verifica que:
 * 1. AGENDA.md foi alterado (seção de bugs foi considerada)
 * 2. Ou alerta que pode haver bugs não registrados
 *
 * Aviso apenas (warn), não bloqueia — bugs são intenção do desenvolvedor.
 *
 * Uso: node scripts/rules/rule-11-bug-registry.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { git, ok, err, warn, ROOT } from "../lib.mjs";

// Verifica se diff inclui mudanças em src/ (código)
const codeDiff = git("git diff --cached --name-only -- 'src/' 2>/dev/null");

if (!codeDiff) {
  // Sem alterações em código, pulamos
  ok("sem alterações em src/ — registro de bugs não aplicável (regra #11)");
  process.exit(0);
}

// Verifica se AGENDA.md foi alterado no mesmo commit
const agendaChanged = git("git diff --cached --name-only -- 'docs/AGENDA.md' 2>/dev/null");
const bugsSection = git(`git diff --cached -- 'docs/AGENDA.md' | grep -c "🐞 Bugs" 2>/dev/null`);

if (!agendaChanged) {
  warn("src/ alterado mas AGENDA.md não foi modificado (regra #11)");
  warn("Se encontrou bugs, registre-os em AGENDA.md → 🐞 Bugs Encontrados");
  // warn apenas, não bloqueia
}

ok("registro de bugs verificado (regra #11)");
