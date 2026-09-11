# 🔭 Radar de Vulnerabilidades

> Atualizado em: 2026-09-11T11:13:49.823Z

## ⚠️  Vulnerabilidades Ativas (7 pacotes)

### 🟠 browserslist@4.28.5 (high)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | Browserslist: Unbounded memory growth (no cache eviction) via disti... [🔗](https://github.com/advisories/GHSA-c83g-rgw3-j3cx) | `<=4.28.6` | high |
| 2 | Browserslist: Uncaught crash / prototype write via untrusted browse... [🔗](https://github.com/advisories/GHSA-73wf-gq98-2v4g) | `<=4.28.6` | high |

### 🟠 fast-uri@3.1.5 (high)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | fast-uri vulnerable to host confusion via skipped IDN canonicalizat... [🔗](https://github.com/advisories/GHSA-5jgf-p345-68v8) | `>=3.1.3 <3.1.6` | high |
| 2 | fast-uri vulnerable to server-side request forgery via malformed IP... [🔗](https://github.com/advisories/GHSA-f65p-4m7j-42xc) | `>=3.0.0 <3.1.6` | high |
| 3 | fast-uri vulnerable to server-side request forgery via repeated hos... [🔗](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) | `>=3.1.2 <3.1.6` | high |
| 4 | fast-uri vulnerable to host confusion via percent-encoded scheme no... [🔗](https://github.com/advisories/GHSA-jqff-g426-hqxp) | `>=3.0.0 <3.1.6` | high |

### 🟠 js-yaml@4.3.1 (high)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | js-yaml: maxTotalMergeKeys does not limit CPU use for empty merge s... [🔗](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | `>=4.0.0 <4.3.2` | high |

### 🟡 @vitest/mocker@4.1.10 (moderate)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Red... [🔗](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) | `>=2.1.0 <4.1.11` | moderate |

### 🟡 baseline-browser-mapping@2.10.42 (moderate)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | baseline-browser-mapping process termination on invalid input cause... [🔗](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv) | `>=2.0.0 <2.11.0` | moderate |

### 🟡 vitest@4.1.10 (moderate)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Red... [🔗](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) | `>=2.1.0 <4.1.11` | moderate |

> 📦 Dependência direta

### 🟢 postcss-selector-parser@6.1.2 (low)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | postcss-selector-parser allows denial of service through uncontroll... [🔗](https://github.com/advisories/GHSA-w9m9-85wc-3x92) | `>=6.1.0 <6.1.3` | low |

---

**Para resolver:**
- `npm update <pacote>` — se houver versão segura
- `npm audit fix` — corrige automaticamente (pode quebrar)
- Verificar advisories individuais nos links acima
