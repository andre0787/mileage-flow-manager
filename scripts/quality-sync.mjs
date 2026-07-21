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

function getRequiredChecks() {
    try {
        const repo = execSync("gh repo view --json owner,name -q '.owner.login + \"/\" + .name'", { encoding: "utf8" }).trim();
        const output = execSync(`gh api repos/${repo}/branches/main/protection`, { encoding: "utf8" });
        const protection = JSON.parse(output);
        const contexts = protection?.required_status_checks?.contexts || [];
        if (contexts.length === 0) return [];
        // ponytail: batch check last status for each required check via recent commits
        const recentSha = execSync("git rev-parse main", { encoding: "utf8" }).trim();
        const checksOut = execSync(`gh api repos/${repo}/commits/${recentSha}/check-runs --paginate`, { encoding: "utf8" });
        const checks = JSON.parse(checksOut).check_runs || [];
        return contexts.map(name => {
            const match = checks.find(c => c.name === name);
            return { name, conclusion: match?.conclusion || "pending", url: match?.url || "" };
        });
    } catch (e) {
        return []; // tolera indisponibilidade
    }
}

const runs = getWorkflowRuns();
const required = getRequiredChecks();

let content = `# Qualidade do Projeto

Esta seção reflete o estado atual dos checks de CI (autenticado via GitHub CLI).

## Últimas Execuções de CI
| Workflow | Status | URL |
|----------|--------|-----|
`;

for (const run of runs) {
    content += `| ${run.name} | ${run.conclusion || run.status} | [Link](${run.url}) |\n`;
}

if (required.length > 0) {
    content += `
## Required Checks (proteção de main)
| Check | Status |
|-------|--------|
`;
    for (const check of required) {
        const icon = check.conclusion === "success" ? "✅" : check.conclusion === "failure" ? "❌" : "⏳";
        content += `| ${check.name} | ${icon} ${check.conclusion} |\n`;
    }
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
