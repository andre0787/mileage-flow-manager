#!/usr/bin/env node

/**
 * check-radar.mjs — 🔭 Radar de vulnerabilidades npm
 *
 * Varre TODAS as dependências em busca de vulnerabilidades sem patch oficial
 * e mantém no radar até serem resolvidas.
 *
 * Integrado ao session:start — aparece no início de toda sessão.
 *
 * Uso: node scripts/check-radar.mjs
 *
 * Exit codes:
 *   0 — radar limpo (sem vulnerabilidades ativas)
 *   1 — radar alerta (uma ou mais vulnerabilidades detectadas)
 *
 * ponytail: execSync + JSON.parse + semver manual, zero deps.
 */

import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const RADAR_STATE_PATH = resolve(ROOT, "docs/RADAR.md");

// ─── Semver helpers (sem dependências) ───

function parseSemver(v) {
  if (typeof v !== "string") return null;
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: parseInt(m[1]), minor: parseInt(m[2]), patch: parseInt(m[3]) };
}

function compareSemver(a, b) {
  if (!a || !b) return NaN;
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function satisfies(version, range) {
  const v = parseSemver(version);
  if (!v) return false;

  const parts = range.split(" ").filter(Boolean);

  // Formato "6.0.0 - 7.17.0"
  if (parts.length === 3 && parts[1] === "-") {
    const low = parseSemver(parts[0]);
    const high = parseSemver(parts[2]);
    if (!low || !high) return false;
    return compareSemver(v, low) >= 0 && compareSemver(v, high) <= 0;
  }

  // Formato "7.0.0-pre.0 - 7.11.0"
  if (parts.length === 3 && parts[1] === "-" && (parts[0].includes("pre") || parts[0].includes("alpha") || parts[0].includes("beta"))) {
    const high = parseSemver(parts[2]);
    if (!high) return false;
    return compareSemver(v, high) <= 0;
  }

  // Formato padrão: ">=7.0.0 <=7.11.0", ">=7.0.0 <7.12.0"
  let low = null, high = null;
  let lowInclusive = false, highInclusive = false;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith(">=")) { low = parseSemver(p.slice(2)); lowInclusive = true; }
    else if (p.startsWith(">")) { low = parseSemver(p.slice(1)); lowInclusive = false; }
    else if (p.startsWith("<=")) { high = parseSemver(p.slice(2)); highInclusive = true; }
    else if (p.startsWith("<")) { high = parseSemver(p.slice(1)); highInclusive = false; }
  }

  if (low && compareSemver(v, low) < (lowInclusive ? 0 : 1)) return false;
  if (high && compareSemver(v, high) > (highInclusive ? 0 : -1)) return false;
  return true;
}

// ─── Leitura de versões instaladas ───

function getInstalledVersions() {
  try {
    const out = execSync("npm ls --all --json 2>/dev/null", {
      cwd: ROOT, encoding: "utf8", timeout: 10000,
    });
    const parsed = JSON.parse(out);
    const versions = {};

    // Navega na árvore de dependências
    function walk(tree, path) {
      if (!tree) return;
      if (tree.name && tree.version) {
        versions[tree.name] = tree.version;
      }
      const deps = tree.dependencies || tree.devDependencies || {};
      for (const [name, dep] of Object.entries(deps)) {
        walk(dep, [...path, name]);
      }
    }
    walk(parsed, []);

    // Sobrescreve com package-lock.json (mais preciso)
    if (existsSync(resolve(ROOT, "package-lock.json"))) {
      try {
        const lock = JSON.parse(readFileSync(resolve(ROOT, "package-lock.json"), "utf8"));
        for (const [pkgPath, info] of Object.entries(lock.packages || {})) {
          if (pkgPath && info.version) {
            const name = pkgPath.split("node_modules/").pop();
            if (name && !name.includes("/")) {
              versions[name] = info.version;
            }
          }
        }
      } catch { /* fallback */ }
    }

    return versions;
  } catch {
    return {};
  }
}

// ─── Scaneamento de vulnerabilidades ───

function scanVulnerabilities(installedVersions) {
  let stdout = "";
  try {
    stdout = execSync("npm audit --json", {
      cwd: ROOT, encoding: "utf8", timeout: 30000,
    });
  } catch (e) {
    if (e.stdout) stdout = e.stdout;
    else throw e;
  }

  const data = JSON.parse(stdout);
  const vulns = data.vulnerabilities || {};
  const results = [];

  for (const [pkg, info] of Object.entries(vulns)) {
    const version = installedVersions[pkg] || "?";
    const via = info.via || [];
    const severity = info.severity || "?";

    const activeAdvisories = [];
    for (const v of via) {
      if (typeof v === "object" && v.range && v.title) {
        try {
          if (satisfies(version, v.range)) {
            activeAdvisories.push({
              title: v.title,
              range: v.range,
              url: v.url || "",
              severity: v.severity || severity,
              cwe: Array.isArray(v.cwe) ? v.cwe.join(", ") : (v.cwe || ""),
            });
          }
        } catch { /* skip */ }
      }
    }

    // Também captura a range do próprio pacote (quando npm audit reporta
    // a faixa completa em vez de advisories individuais)
    if (activeAdvisories.length === 0) {
      // Tenta usar a range do pacote se ela existir e a versão bater
      // (npm audit reporta 'range' no nível do pacote)
      if (info.range && version !== "?" && satisfies(version, info.range)) {
        // Se tem 'via' numérico (IDs internos), não conseguimos extrair título
        // mas o pacote está vulnerável
        const hasNumericVia = via.some(v => typeof v === "number");
        if (hasNumericVia) {
          activeAdvisories.push({
            title: `${pkg} — vulnerability reported by npm audit`,
            range: info.range,
            url: "",
            severity: severity,
            cwe: "",
          });
        }
      }
    }

    if (activeAdvisories.length > 0) {
      results.push({
        package: pkg,
        version,
        severity: severity,
        advisories: activeAdvisories,
        isDirect: info.isDirect || false,
      });
    }
  }

  return results;
}

// ─── Persistência do radar ───

function updateRadarDoc(results) {
  const now = new Date().toISOString();
  const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
  const sorted = [...results].sort((a, b) => {
    const sa = severityOrder[a.severity] ?? 99;
    const sb = severityOrder[b.severity] ?? 99;
    return sa - sb;
  });

  let md = `# 🔭 Radar de Vulnerabilidades\n\n`;
  md += `> Atualizado em: ${now}\n\n`;

  if (sorted.length === 0) {
    md += `## ✅ Radar Limpo\nNenhuma vulnerabilidade ativa detectada.\n`;
  } else {
    md += `## ⚠️  Vulnerabilidades Ativas (${sorted.length} pacotes)\n\n`;

    for (const r of sorted) {
      const severityIcon = { critical: "🔴", high: "🟠", moderate: "🟡", low: "🟢" }[r.severity] || "⚪";
      md += `### ${severityIcon} ${r.package}@${r.version} (${r.severity})\n\n`;
      md += `| # | Advisory | Range | Severidade |\n`;
      md += `|---|----------|-------|------------|\n`;
      r.advisories.forEach((adv, i) => {
        const shortTitle = adv.title.length > 70 ? adv.title.slice(0, 67) + "..." : adv.title;
        const urlPart = adv.url ? ` [🔗](${adv.url})` : "";
        md += `| ${i + 1} | ${shortTitle}${urlPart} | \`${adv.range}\` | ${adv.severity} |\n`;
      });
      md += `\n`;
      if (r.isDirect) md += `> 📦 Dependência direta\n\n`;
    }

    md += `---\n\n`;
    md += `**Para resolver:**\n`;
    md += `- \`npm update <pacote>\` — se houver versão segura\n`;
    md += `- \`npm audit fix\` — corrige automaticamente (pode quebrar)\n`;
    md += `- Verificar advisories individuais nos links acima\n`;
  }

  try {
    writeFileSync(RADAR_STATE_PATH, md, "utf8");
  } catch {
    // Não crítico se falhar
  }
}

// ─── Output ───

function formatResults(results) {
  if (results.length === 0) {
    console.log("✅ 🔭 Radar limpo — nenhuma vulnerabilidade ativa.");
    return;
  }

  const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
  const sorted = [...results].sort((a, b) => {
    const sa = severityOrder[a.severity] ?? 99;
    const sb = severityOrder[b.severity] ?? 99;
    return sa - sb;
  });

  const totalAdvisories = sorted.reduce((acc, r) => acc + r.advisories.length, 0);
  const bySeverity = {};
  for (const r of sorted) {
    bySeverity[r.severity] = (bySeverity[r.severity] || 0) + r.advisories.length;
  }
  const severitySummary = Object.entries(bySeverity)
    .map(([s, n]) => `${s}: ${n}`)
    .join(", ");

  console.log("");
  console.log("⚠️  ═══════════════════════════════════════════════");
  console.log("⚠️   🔭 RADAR DE VULNERABILIDADES");
  console.log("⚠️  ═══════════════════════════════════════════════");
  console.log(`   Pacotes afetados: ${sorted.length}`);
  console.log(`   Advisories:       ${totalAdvisories} (${severitySummary})`);
  console.log("");

  for (const r of sorted) {
    const severityIcon = { critical: "🔴", high: "🟠", moderate: "🟡", low: "🟢" }[r.severity] || "⚪";
    const direct = r.isDirect ? " 📦" : "";
    console.log(`   ${severityIcon} ${r.package}@${r.version} (${r.severity})${direct}`);

    for (const adv of r.advisories) {
      const url = adv.url ? `\n     ${adv.url}` : "";
      console.log(`     → ${adv.title}${url}`);
    }
    console.log("");
  }

  console.log(`   📄 Relatório salvo em: docs/RADAR.md`);
  console.log(`   🔧 npm update <pacote> — quando houver patch`);
  console.log("");
}

function main() {
  const installed = getInstalledVersions();
  let results = [];

  try {
    results = scanVulnerabilities(installed);
  } catch (e) {
    console.log("⚠️  🔭 Radar check indisponível — npm audit falhou.");
    if (process.env.DEBUG_RADAR) console.error(e.message);
    process.exitCode = 1;
    return;
  }

  // Atualiza docs/RADAR.md
  updateRadarDoc(results);

  // Output pro terminal
  formatResults(results);

  process.exitCode = results.length > 0 ? 1 : 0;
}

await main();