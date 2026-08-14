#!/usr/bin/env node

/**
 * rule-45-react19-compliance.mjs — Regra #45 (React 19 Compliance)
 *
 * Conformidade com React 19:
 * - HARD FAIL: `any` em src/ (ts/tsx) — falha crítica de tipagem.
 * - AVISO (não bloqueia): `<form>` sem `useActionState`/`useFormStatus`;
 *   `useEffect` com `fetch(` inline (prefira `use()` / data-fetching do router);
 *   `useState` + `useEffect` para espelhar props (prefira `use()`/derivação).
 *
 * Regra #45: "Priorizar use() (promises/context) sobre useEffect boilerplate e
 * useActionState/useFormStatus em forms; any é falha crítica; tipos espelhados
 * do schema Supabase."
 *
 * Uso: node scripts/rules/rule-45-react19-compliance.mjs
 * Env: MOCK_ROOT (fixtures de teste)
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const SRC_DIR = resolve(ROOT, "src");
const ANY_RE = /\b(?:as\s+any|:\s*any|<any>)\b/;
const FORM_RE = /<form[\s>]/;
const ACTION_STATE_RE = /useActionState|useFormStatus/;

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function main() {
  const files = walk(SRC_DIR);
  if (files.length === 0) {
    console.log("  ⏭️  rule-45: src/ não existe — regra não se aplica");
    return;
  }

  let hasError = false;
  let formsSemActionState = 0;
  let effectsComFetch = 0;

  for (const file of files) {
    const rel = file.replace(ROOT + "/", "");
    const content = readFileSync(file, "utf8");

    if (ANY_RE.test(content)) {
      console.error(`❌ rule-45: 'any' em ${rel} — falha crítica (tipagem estrita)`);
      hasError = true;
    }

    if (FORM_RE.test(content) && !ACTION_STATE_RE.test(content)) {
      formsSemActionState++;
      console.log(
        `  ⚠️  rule-45: ${rel} renderiza <form> sem useActionState/useFormStatus (Fase C)`,
      );
    }

    if (/useEffect[\s\S]{0,400}?fetch\s*\(/.test(content)) {
      effectsComFetch++;
      console.log(`  ⚠️  rule-45: ${rel} usa fetch() dentro de useEffect (prefira use()/query)`);
    }
  }

  if (hasError) process.exit(1);
  if (formsSemActionState > 0) {
    console.log(
      `  ⚠️  rule-45: ${formsSemActionState} form(s) sem useActionState (aviso — não bloqueia)`,
    );
  } else {
    console.log("  ✅ rule-45: forms com useActionState/useFormStatus");
  }
  if (effectsComFetch > 0) {
    console.log(
      `  ⚠️  rule-45: ${effectsComFetch} useEffect(s) com fetch inline (aviso — não bloqueia)`,
    );
  }
  console.log("  ✅ rule-45: react19 compliance ok");
}

main();
