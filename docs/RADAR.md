# 🔭 Radar de Vulnerabilidades

> Atualizado em: 2026-10-18T19:58:44.895Z

## ⚠️  Vulnerabilidades Ativas (5 pacotes)

### 🟠 brace-expansion@5.0.9 (high)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite c... [🔗](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | `>=4.0.0 <5.0.12` | moderate |
| 2 | brace-expansion: DoS via uncontrolled recursion on nested brace gro... [🔗](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | `>=4.0.0 <5.0.11` | high |
| 3 | brace-expansion: DoS via uncontrolled recursion in parseCommaParts ... [🔗](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | `>=4.0.0 <5.0.10` | high |

### 🟠 braces@3.0.3 (high)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | braces vulnerable to stack-exhaustion denial of service through dee... [🔗](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | `<=3.0.3` | high |

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

### 🟡 postcss-selector-parser@6.1.4 (moderate)

| # | Advisory | Range | Severidade |
|---|----------|-------|------------|
| 1 | PostCSS: Quadratic complexity in flat selector parsing allows CPU e... [🔗](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | `<7.1.6` | moderate |

---

**Para resolver:**
- `npm update <pacote>` — se houver versão segura
- `npm audit fix` — corrige automaticamente (pode quebrar)
- Verificar advisories individuais nos links acima
