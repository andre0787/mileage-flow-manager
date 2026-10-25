# 🔭 Radar de Vulnerabilidades

> Atualizado em: 2026-10-25T15:13:34.297Z

## ⚠️  Vulnerabilidades Ativas (9 pacotes)

### 🟠 brace-expansion@5.0.9 (high)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite c... [🔗](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | `>=4.0.0 <5.0.12` | moderate |
| 2 | brace-expansion: DoS via uncontrolled recursion on nested brace gro... [🔗](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | `>=4.0.0 <5.0.11` | high |
| 3 | brace-expansion: DoS via uncontrolled recursion in parseCommaParts ... [🔗](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | `>=4.0.0 <5.0.10` | high |

### 🟠 source-map-js@1.2.1 (high)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | source-map-js allows event-loop denial of service through indexed s... [🔗](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | `>=1.0.0 <1.2.2` | high |

### 🟠 undici@8.9.0 (high)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | undici vulnerable to Denial of Service via unhandled error in WebSo... [🔗](https://github.com/advisories/GHSA-3wwx-pv8p-q78v) | `>=8.1.0 <8.10.2` | moderate |
| 2 | undici vulnerable to Denial of Service via orphaned RetryHandler re... [🔗](https://github.com/advisories/GHSA-pmjh-fq2x-6v4x) | `>=8.0.0 <8.10.2` | moderate |
| 3 | undici vulnerable to downstream response splitting via retry interc... [🔗](https://github.com/advisories/GHSA-r53p-7pc4-xj5r) | `>=8.0.0 <8.10.2` | low |
| 4 | undici vulnerable to Denial of Service via unrequested WebSocket su... [🔗](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5) | `>=8.0.0 <8.10.2` | high |
| 5 | undici vulnerable to Denial of Service via unbounded decompression ... [🔗](https://github.com/advisories/GHSA-3xpg-4rpp-hhhm) | `>=8.0.0 <8.10.2` | moderate |
| 6 | undici vulnerable to cross-user cookie disclosure via Set-Cookie ca... [🔗](https://github.com/advisories/GHSA-2jfj-6hjv-fm6j) | `>=8.0.0 <8.10.2` | moderate |
| 7 | undici vulnerable to response truncation via oversized chunked resp... [🔗](https://github.com/advisories/GHSA-2gqq-gqf2-x968) | `>=8.0.0 <8.10.2` | low |
| 8 | undici vulnerable to TLS certificate validation bypass via dropped ... [🔗](https://github.com/advisories/GHSA-w293-vg96-wgc3) | `>=8.0.0 <8.10.2` | high |
| 9 | undici vulnerable to caching and replay of unsafe HTTP method respo... [🔗](https://github.com/advisories/GHSA-8436-99hf-9mmv) | `>=8.0.0 <8.10.2` | low |
| 10 | undici vulnerable to Denial of Service via WebSocketStream unclean ... [🔗](https://github.com/advisories/GHSA-rx4f-c7p8-82vq) | `>=8.0.0 <8.10.2` | moderate |
| 11 | undici vulnerable to Denial of Service via unbounded memory in the ... [🔗](https://github.com/advisories/GHSA-4qv8-2p9j-2685) | `>=8.0.0 <8.12.2` | moderate |
| 12 | undici vulnerable to Subresource Integrity bypass via non-lowercase... [🔗](https://github.com/advisories/GHSA-f72v-6w45-q472) | `>=8.0.0 <8.12.2` | moderate |
| 13 | undici vulnerable to Denial of Service via unhandled error on exces... [🔗](https://github.com/advisories/GHSA-xjj6-f33q-929c) | `>=8.0.0 <8.12.2` | high |

### 🟠 vite@6.4.3 (high)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | launch-editor: escapeCmdArgs() omits % escaping on Windows [🔗](https://github.com/advisories/GHSA-698v-4r3x-3vcv) | `<=6.4.3` | moderate |
| 2 | launch-editor: Editor CLI flag misinterpretation causing arbitrary ... [🔗](https://github.com/advisories/GHSA-r825-w8mm-5pxw) | `<=6.4.3` | moderate |
| 3 | launch-editor: `fs.existsSync()` existence check can be bypassed on... [🔗](https://github.com/advisories/GHSA-587h-7wmj-h5pm) | `<=6.4.3` | high |
| 4 | Vite: Cross origin script execution through Vite custom middleware [🔗](https://github.com/advisories/GHSA-9jrq-w75r-8gcw) | `<=6.4.3` | low |
| 5 | Vite: Files outside `server.fs.allow` could be served when project ... [🔗](https://github.com/advisories/GHSA-rq7h-c2jc-7f22) | `<=6.4.3` | moderate |

> 📦 Dependência direta

### 🟠 zod@4.4.3 (high)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | Zod can exhaust memory while validating oversized constrained colle... [🔗](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | `<4.6.6` | high |

### 🟡 @vitest/mocker@4.1.11 (moderate)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | Vitest: Code injection via unauthenticated manual mock registration [🔗](https://github.com/advisories/GHSA-qxg6-89mg-rqv8) | `>=2.1.0-beta.7 <4.1.12` | moderate |
| 2 | Vitest: Windows backslash traversal bypasses the @vitest/mocker red... [🔗](https://github.com/advisories/GHSA-xp26-3454-mjgp) | `>=4.1.11 <4.1.12` | moderate |

### 🟡 fast-uri@3.1.8 (moderate)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | fast-uri vulnerable to URI scheme spoofing via percent-encoded sche... [🔗](https://github.com/advisories/GHSA-w74x-v6f9-j3xg) | `>=3.0.0 <3.1.9` | moderate |
| 2 | fast-uri vulnerable to improper path equivalence in relative refere... [🔗](https://github.com/advisories/GHSA-xhq7-xmqj-769h) | `>=3.0.0 <3.1.9` | low |
| 3 | fast-uri vulnerable to host confusion via unchecked WHATWG host can... [🔗](https://github.com/advisories/GHSA-wjr9-j795-jxcr) | `>=3.1.3 <3.1.9` | moderate |
| 4 | fast-uri vulnerable to scheme injection via an unescaped first-segm... [🔗](https://github.com/advisories/GHSA-333x-w4r6-6crp) | `>=3.0.0 <3.1.9` | low |

### 🟡 postcss-selector-parser@6.1.4 (moderate)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | PostCSS: Quadratic complexity in flat selector parsing allows CPU e... [🔗](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | `<7.1.6` | moderate |

### 🟢 serialize-javascript@7.0.7 (low)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | Serialize JavaScript: Cross-site scripting (XSS) via unescaped </sc... [🔗](https://github.com/advisories/GHSA-m5mm-p8h7-m29v) | `<7.1.3` | low |

---

**Para resolver:**
- `npm update <pacote>` — se houver versão segura
- `npm audit fix` — corrige automaticamente (pode quebrar)
- Verificar advisories individuais nos links acima
