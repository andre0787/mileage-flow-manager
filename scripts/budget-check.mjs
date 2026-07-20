#!/usr/bin/env node

import { readFileSync, readdirSync, lstatSync, existsSync } from "fs";
import { resolve } from "path";

const BASELINE = JSON.parse(readFileSync("docs/baselines/bundle.json", "utf8"));
const DIST_ASSETS = resolve("dist/assets");

if (!existsSync(DIST_ASSETS)) {
    console.error("❌ dist/assets não encontrado. Rode npm run build antes.");
    process.exit(1);
}

function getChunkSize(prefix) {
    const files = readdirSync(DIST_ASSETS);
    const match = files.find(f => f.startsWith(prefix) && f.endsWith(".js"));
    if (!match) return 0;
    const stats = lstatSync(resolve(DIST_ASSETS, match));
    return stats.size / 1024; // in KB
}

let failed = false;

const indexSize = getChunkSize("index-");
const chartsSize = getChunkSize("charts-");
const uiSize = getChunkSize("ui-");

console.log(`📊 Bundle Budget Report:`);
console.log(`  Index:  ${indexSize.toFixed(2)} KB (Limit: ${BASELINE.chunks.index} KB)`);
console.log(`  Charts: ${chartsSize.toFixed(2)} KB (Limit: ${BASELINE.chunks.charts} KB)`);
console.log(`  UI:     ${uiSize.toFixed(2)} KB (Limit: ${BASELINE.chunks.ui} KB)`);

if (indexSize > BASELINE.chunks.index) { console.error("❌ Index chunk excede"); failed = true; }
if (chartsSize > BASELINE.chunks.charts) { console.error("❌ Charts chunk excede"); failed = true; }
if (uiSize > BASELINE.chunks.ui) { console.error("❌ UI chunk excede"); failed = true; }

if (failed) process.exit(1);
console.log("✅ Bundle budget OK");
