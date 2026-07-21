#!/usr/bin/env node

import { execSync } from "child_process";

// 1. Get PR metrics from GitHub CLI
function getPRs() {
  const output = execSync('gh pr list --state all --limit 50 --json number,title,createdAt,closedAt,state', { encoding: 'utf8' });
  return JSON.parse(output);
}

// 2. Placeholder for metrics calculation
async function collectMetrics() {
  const prs = getPRs();
  
  const metrics = {
    totalPRs: prs.length,
    closedPRs: prs.filter(pr => pr.state === 'CLOSED').length,
    openPRs: prs.filter(pr => pr.state === 'OPEN').length,
    // Add logic for bypasses (by searching commit description? for now count --no-verify)
    bypasses: 0, 
    // verde-na-1ª requires checking workflow status history (complex for now)
  };

  console.log("📊 Métricas do Programa:");
  console.log(JSON.stringify(metrics, null, 2));
}

collectMetrics().catch(console.error);
