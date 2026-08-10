#!/usr/bin/env node

/**
 * rule-40-architect.mjs — Regra #40 (Architect): estrutura Feature-First.
 *
 * Validações:
 * A) Se src/features/ existe, cada subdiretório de feature DEVE ter index.ts (barrel).
 * B) Para cada query `supabase.from("<tabela>")` em src/features/*, verifica se
 *    supabase/migrations/ contém CREATE POLICY com USING (auth.uid()) e ON public.<tabela>.
 *    Falha se a tabela não tiver política de RLS.
 * Vacuous pass quando src/features/ não existe (estado atual → não bloqueia P0).
 *
 * Regra #40: "Estrutura Feature-First: módulos em src/features/[feature],
 * barrel index.ts, RLS verificado"
 *
 * ponytail: fs + path nativos, zero deps.
 * Modo fixture: MOCK_ROOT (padrão das rules do repo).
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const FEATURES_DIR = join(ROOT, "src", "features");
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");

/** Varre um diretório recursivamente coletando arquivos .ts/.tsx */
function collectFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      collectFiles(p, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(p);
    }
  }
  return acc;
}

/**
 * Retorna true se a tabela tem RLS em alguma migration (CREATE POLICY + USING (auth.uid()) + ON public.<tabela>).
 *
 * Divide o conteúdo em blocos de policy (create policy ... até o próximo create policy):
 * cada bloco deve conter ON public.<tabela> E USING (auth.uid()) NO MESMO bloco.
 * Sem isso, o regex global cruzaria o fim de uma policy e casaria USING (auth.uid())
 * de uma policy POSTERIOR no mesmo arquivo (falso positivo).
 */
function hasRlsPolicy(table) {
  if (!existsSync(MIGRATIONS_DIR)) return false;
  const esc = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const onRe = new RegExp(`ON\\s+public\\.${esc}\\b`, "i");
  const usingRe = /USING\s*\(\s*auth\.uid\(\)/i;
  for (const entry of readdirSync(MIGRATIONS_DIR)) {
    if (!/\.sql$/.test(entry)) continue;
    const content = readFileSync(join(MIGRATIONS_DIR, entry), "utf8");
    for (const block of content.split(/create\s+(?:or\s+replace\s+)?policy/i).slice(1)) {
      if (onRe.test(block) && usingRe.test(block)) return true;
    }
  }
  return false;
}

function main() {
  if (!existsSync(FEATURES_DIR)) {
    console.log("  ⏭️  rule-40: src/features/ não existe — vacuous pass (P1 não iniciado)");
    return;
  }

  let hasError = false;

  // A) barrel index.ts por feature
  const featureDirs = readdirSync(FEATURES_DIR).filter((e) => statSync(join(FEATURES_DIR, e)).isDirectory());
  for (const dir of featureDirs) {
    if (!existsSync(join(FEATURES_DIR, dir, "index.ts"))) {
      console.error(`❌ rule-40: feature "${dir}" sem barrel — crie src/features/${dir}/index.ts`);
      hasError = true;
    }
  }
  if (featureDirs.length > 0) {
    console.log(`  ✅ rule-40: ${featureDirs.length} feature(s) com barrel index.ts`);
  }

  // B) RLS para tabelas usadas via supabase.from()
  const files = collectFiles(FEATURES_DIR);
  const tables = new Set();
  const fromRe = /supabase\.from\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    let m;
    while ((m = fromRe.exec(content)) !== null) tables.add(m[1]);
  }

  if (tables.size === 0) {
    console.log("  ✅ rule-40: nenhuma query supabase.from() em src/features/ (RLS ok)");
  } else {
    for (const table of [...tables].sort()) {
      if (hasRlsPolicy(table)) {
        console.log(`  ✅ rule-40: tabela public.${table} com política RLS (auth.uid())`);
      } else {
        console.error(`❌ rule-40: tabela "${table}" sem CREATE POLICY com USING (auth.uid()) em supabase/migrations/`);
        hasError = true;
      }
    }
  }

  if (hasError) process.exit(1);
  console.log("  ✅ rule-40: architect ok");
}

main();
