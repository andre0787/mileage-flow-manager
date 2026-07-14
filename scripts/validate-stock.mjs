#!/usr/bin/env node
/**
 * validate-stock.mjs
 * 
 * Valida a consistência do estoque entre entradas, vendas e saldo das contas.
 * 
 * Uso:
 *   node scripts/validate-stock.mjs                        # modo interativo — pede user_id
 *   node scripts/validate-stock.mjs <user_id>               # modo direto
 *   node scripts/validate-stock.mjs <user_id> --fix         # modo direto + fix
 * 
 * O que verifica:
 *   1. Se o saldo de cada conta (accounts.balance) é consistente com
 *      entradas confirmadas - vendas - transferências
 *   2. Se totalMilesGenerated (entradas) ≈ totalStock (contas) + totalSold
 *   3. Se não há entradas "aguardando" que já passaram da data
 * 
 * Retorna exit code 0 se OK, 1 se discrepâncias encontradas.
 */

import { createClient } from "@supabase/supabase-js";

// ─── Config ───
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers ───
function fmt(n) {
  return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function fmtInt(n) {
  return Math.round(Number(n)).toLocaleString("pt-BR");
}

// ─── Main ───
async function main() {
  const args = process.argv.slice(2);
  const fixMode = args.includes("--fix");
  const targetUserId = args.find((a) => !a.startsWith("--"));

  if (!targetUserId) {
    console.log("🔍 Modo interativo: buscando usuários...");
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error("❌ Erro ao listar usuários:", error.message);
      console.log("   Passe o user_id como argumento: node scripts/validate-stock.mjs <user_id>");
      process.exit(1);
    }

    console.log("\nUsuários disponíveis:");
    (users?.users ?? []).forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email ?? "sem email"} — ${u.id}`);
    });
    process.exit(0);
  }

  console.log(`\n🔍 Validando estoque para user: ${targetUserId}\n`);

  // ── Fetch raw data ──
  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", targetUserId);
  if (accErr) throw new Error(`Erro accounts: ${accErr.message}`);

  const { data: entries, error: entErr } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", targetUserId);
  if (entErr) throw new Error(`Erro entries: ${entErr.message}`);

  const { data: sales, error: saleErr } = await supabase
    .from("sales")
    .select("*")
    .eq("user_id", targetUserId);
  if (saleErr) throw new Error(`Erro sales: ${saleErr.message}`);

  const { data: origemTypes, error: otErr } = await supabase
    .from("origem_types")
    .select("*")
    .eq("user_id", targetUserId);
  if (otErr) throw new Error(`Erro origem_types: ${otErr.message}`);

  // ── Parse ──
  const parseDesc = (desc) => {
    if (!desc) return {};
    try { return JSON.parse(desc); } catch { return {}; }
  };

  const parsedEntries = (entries ?? []).map((e) => {
    const d = parseDesc(e.description);
    return {
      id: e.id,
      accountId: e.account_id,
      sourceAccountId: e.source_account_id,
      amount: Number(e.amount),
      amountPaid: Number(e.amount_paid),
      milesGenerated: e.miles_generated != null ? Number(e.miles_generated) : null,
      entryStatus: d.entryStatus,
      date: e.date,
    };
  });

  const parsedSales = (sales ?? []).map((s) => ({
    id: s.id,
    accountId: s.account_id,
    milesUsed: Number(s.miles_used),
    costPerMile: Number(s.cost_per_mile),
    status: s.status,
  }));

  const transferIds = new Set(
    (origemTypes ?? [])
      .filter((ot) => ot.name.toLowerCase().includes("transfer"))
      .map((ot) => ot.id)
  );

  // ── Validation 1: Individual account balance ──
  console.log("─── Validação 1: Saldo por Conta ───\n");

  let totalDiscrepancy = 0;
  let accountsChecked = 0;
  let accountsWithIssues = 0;

  for (const acc of accounts ?? []) {
    accountsChecked++;
    const accId = acc.id;
    const actualBalance = Number(acc.balance);

    // Calculate expected balance from entries, sales, transfers
    let expectedBalance = 0;

    // Entries confirmed (not "aguardando") going INTO this account
    for (const e of parsedEntries) {
      if (e.accountId === accId && e.entryStatus !== "aguardando") {
        expectedBalance += e.milesGenerated ?? e.amount;
      }
    }

    // Transfers OUT of this account (sourceAccountId === accId)
    for (const e of parsedEntries) {
      if (e.sourceAccountId === accId && e.entryStatus !== "aguardando") {
        expectedBalance -= e.amount;  // Raw amount debited from source
      }
    }

    // Sales deducting from this account (non-canceled)
    for (const s of parsedSales) {
      if (s.accountId === accId && s.status !== "cancelado") {
        expectedBalance -= s.milesUsed;
      }
    }

    // Sales cancelled → restore
    for (const s of parsedSales) {
      if (s.accountId === accId && s.status === "cancelado") {
        expectedBalance += s.milesUsed;
      }
    }

    const diff = Math.abs(expectedBalance - actualBalance);
    if (diff > 0.01) {
      accountsWithIssues++;
      totalDiscrepancy += diff;
      console.log(`  ❌ ${acc.name} (${acc.id.slice(0, 8)}...):`);
      console.log(`     Esperado: ${fmtInt(expectedBalance)}`);
      console.log(`     Real:     ${fmtInt(actualBalance)}`);
      console.log(`     Diferença: ${fmtInt(diff)}`);

      if (fixMode) {
        console.log(`     → Corrigindo saldo para ${fmtInt(expectedBalance)}...`);
        await supabase.from("accounts").update({ balance: expectedBalance }).eq("id", accId);
      }
    } else {
      console.log(`  ✅ ${acc.name}: ${fmtInt(actualBalance)}`);
    }
  }

  if (accountsChecked === 0) {
    console.log("  ⚠️  Nenhuma conta encontrada.");
  }

  // ── Validation 2: Global stock consistency ──
  console.log("\n─── Validação 2: Consistência Global ───\n");

  const totalStockActual = (accounts ?? []).reduce((s, a) => s + Number(a.balance), 0);

  const confirmedEntries = parsedEntries.filter((e) => e.entryStatus !== "aguardando" && !e.sourceAccountId);
  const totalMilesGenerated = confirmedEntries.reduce((s, e) => s + (e.milesGenerated ?? e.amount), 0);

  const nonCanceledSales = parsedSales.filter((s) => s.status !== "cancelado");
  const totalSold = nonCanceledSales.reduce((s, sl) => s + sl.milesUsed, 0);

  // Transfers OUT (points debited from source accounts)
  const transfersOut = parsedEntries.filter((e) => e.sourceAccountId && e.entryStatus !== "aguardando");
  const totalTransferred = transfersOut.reduce((s, e) => s + e.amount, 0);

  // Global check: totalStock = totalMilesGenerated - totalSold - totalTransferred
  const expectedGlobal = totalMilesGenerated - totalSold - totalTransferred;
  const globalDiff = Math.abs(expectedGlobal - totalStockActual);

  console.log(`  Milhas geradas (entradas):         ${fmtInt(totalMilesGenerated)}`);
  console.log(`  Milhas vendidas (não canceladas):  -${fmtInt(totalSold)}`);
  console.log(`  Pontos transferidos (débito):      -${fmtInt(totalTransferred)}`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Estoque global esperado:           ${fmtInt(expectedGlobal)}`);
  console.log(`  Estoque real (accounts.balance):   ${fmtInt(totalStockActual)}`);
  if (globalDiff > 0.01) {
    console.log(`  ❌ DISCREPÂNCIA GLOBAL: ${fmtInt(globalDiff)}`);
  } else {
    console.log(`  ✅ OK`);
  }

  // ── Validation 3: Entries "aguardando" overdue ──
  console.log("\n─── Validação 3: Entradas Pendentes Vencidas ───\n");

  const today = new Date().toISOString().split("T")[0];
  const overdue = parsedEntries.filter((e) => e.entryStatus === "aguardando" && e.date < today);

  if (overdue.length > 0) {
    console.log(`  ⚠️  ${overdue.length} entrada(s) pendente(s) vencida(s):`);
    overdue.slice(0, 5).forEach((e) => {
      console.log(`     • ${e.date} — ${e.accountId.slice(0, 8)}... — ${fmtInt(e.amount)} pts`);
    });
    if (overdue.length > 5) console.log(`     ... e mais ${overdue.length - 5}`);
  } else {
    console.log("  ✅ Nenhuma entrada pendente vencida.");
  }

  // ── Summary ──
  console.log("\n─── Resumo ───\n");
  console.log(`  Contas verificadas: ${accountsChecked}`);
  console.log(`  Contas com discrepância: ${accountsWithIssues}`);
  console.log(`  Discrepância total: ${fmtInt(totalDiscrepancy)}`);
  console.log(`  Modo fix: ${fixMode ? "✅ ativo" : "❌ desativado (use --fix para corrigir)"}`);

  const hasErrors = accountsWithIssues > 0 || globalDiff > 0.01;

  if (hasErrors) {
    console.log("\n❌ VALIDAÇÃO FALHOU — discrepâncias encontradas.\n");
    process.exit(1);
  }

  console.log("\n✅ VALIDAÇÃO OK — estoque consistente.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
