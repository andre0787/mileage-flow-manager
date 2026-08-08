import { describe, it, expect } from "vitest";

// ─── Testes do check-radar.mjs (regressão P0) ───────────────────────────────
// Bug corrigido: o radar reportava "limpo" mesmo com vulnerabilidades HIGH
// porque `npm ls --all --json` sai com exit 1 (pacotes invalid/extraneous),
// o try/catch engolia o erro e as versões viravam "?" → satisfies() falhava.

const radar = await import("../../scripts/check-radar.mjs");

describe("parseSemver / satisfies — ranges do npm audit", () => {
  it("js-yaml 4.3.0 é vulnerável ao range >=4.0.0 <4.3.1", () => {
    expect(radar.satisfies("4.3.0", ">=4.0.0 <4.3.1")).toBe(true);
  });

  it("js-yaml 4.3.1 (fix) não é vulnerável ao mesmo range", () => {
    expect(radar.satisfies("4.3.1", ">=4.0.0 <4.3.1")).toBe(false);
  });

  it("nanoid 3.3.16 é vulnerável ao range <3.3.17", () => {
    expect(radar.satisfies("3.3.16", "<3.3.17")).toBe(true);
  });

  it("nanoid 3.3.17 (fix) não é vulnerável", () => {
    expect(radar.satisfies("3.3.17", "<3.3.17")).toBe(false);
  });

  it("range com hífen '6.0.0 - 7.17.0' funciona", () => {
    expect(radar.satisfies("7.16.0", "6.0.0 - 7.17.0")).toBe(true);
    expect(radar.satisfies("7.18.0", "6.0.0 - 7.17.0")).toBe(false);
  });

  it("versão desconhecida ('?') não satisfaz nenhuma range", () => {
    expect(radar.satisfies("?", ">=4.0.0 <4.3.1")).toBe(false);
  });
});

describe("parseLockVersions — extração de versões do package-lock.json", () => {
  const lock = JSON.stringify({
    packages: {
      "": { name: "vite_react_shadcn_ts", version: "0.0.0" },
      "node_modules/js-yaml": { version: "4.3.0" },
      "node_modules/nanoid": { version: "3.3.16" },
      "node_modules/@eslint/eslintrc": { version: "3.3.6" },
      "node_modules/react/node_modules/scheduler": { version: "0.25.2" },
    },
  });

  it("extrai pacotes de topo e scoped (@scope/pkg)", () => {
    const v = radar.parseLockVersions(lock);
    expect(v["js-yaml"]).toBe("4.3.0");
    expect(v["nanoid"]).toBe("3.3.16");
    expect(v["@eslint/eslintrc"]).toBe("3.3.6");
    expect(v["scheduler"]).toBe("0.25.2");
    expect(v[""]).toBeUndefined();
  });

  it("retorna {} para conteúdo inválido", () => {
    expect(radar.parseLockVersions("not-json")).toEqual({});
  });
});

describe("getInstalledVersions — não depende do estado do node_modules", () => {
  it("lê versões do package-lock.json (fonte primária)", () => {
    const versions = radar.getInstalledVersions();
    // O lock do projeto define js-yaml e nanoid (versões atuais pós-audit-fix)
    expect(typeof versions["js-yaml"]).toBe("string");
    expect(typeof versions["nanoid"]).toBe("string");
    // React 19 no lock (node_modules local pode estar stale — não importa)
    expect(versions["react"]).toBe("19.2.8");
  });
});

describe("scanVulnerabilities — fail-closed com versão desconhecida", () => {
  const auditJson = JSON.stringify({
    vulnerabilities: {
      "js-yaml": {
        severity: "high",
        isDirect: false,
        via: [
          {
            title: "JS-YAML: Quadratic CPU consumption in !!omap resolution",
            range: ">=4.0.0 <4.3.1",
            severity: "high",
            url: "https://github.com/advisories/GHSA-5p4m-2wfm-xmqj",
          },
        ],
      },
    },
  });

  it("detecta advisory ativa quando a versão instalada satisfaz a range", () => {
    const results = radar.scanVulnerabilities({ "js-yaml": "4.3.0" }, auditJson);
    expect(results.length).toBe(1);
    expect(results[0].package).toBe("js-yaml");
    expect(results[0].severity).toBe("high");
    expect(results[0].advisories[0].range).toBe(">=4.0.0 <4.3.1");
  });

  it("não reporta quando a versão instalada é segura", () => {
    const results = radar.scanVulnerabilities({ "js-yaml": "4.3.1" }, auditJson);
    expect(results.length).toBe(0);
  });

  it("fail-closed: versão desconhecida é tratada como vulnerável (não mais 'limpo')", () => {
    const results = radar.scanVulnerabilities({}, auditJson);
    expect(results.length).toBe(1);
    expect(results[0].package).toBe("js-yaml");
    expect(results[0].version).toBe("?");
  });
});
