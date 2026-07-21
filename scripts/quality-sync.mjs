#!/usr/bin/env node

import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";

const QUALITY_MD_PATH = "QUALITY.md";

function getWorkflowRuns() {
    try {
        const output = execSync("gh run list --limit 5 --json name,conclusion,status,url -q '.[0:5]'", { encoding: "utf8" });
        return JSON.parse(output);
    } catch (e) {
        return [];
    }
}

const runs = getWorkflowRuns();

let content = `# Qualidade do Projeto

Esta seção reflete o estado atual dos checks de CI (autenticado via GitHub CLI).

## Últimas Execuções de CI
| Workflow | Status | URL |
|----------|--------|-----|
`;

for (const run of runs) {
    content += `| ${run.name} | ${run.conclusion || run.status} | [Link](${run.url}) |\n`;
}

// Check if QUALITY.md exists, read if it does, replace/append
let existingContent = "";
try {
    existingContent = readFileSync(QUALITY_MD_PATH, "utf8");
} catch (e) {
    // File doesn't exist, create it
}

// Very basic sync: just replace the section
const markerStart = "<!-- CI-RUNS-START -->";
const markerEnd = "<!-- CI-RUNS-END -->";

const newContent = `${markerStart}
${content}
${markerEnd}`;

if (existingContent.includes(markerStart)) {
    const regex = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`);
    existingContent = existingContent.replace(regex, newContent);
} else {
    existingContent += `\n${newContent}`;
}

writeFileSync(QUALITY_MD_PATH, existingContent);
// console.log("✅ QUALITY.md atualizado com runs de CI.");
