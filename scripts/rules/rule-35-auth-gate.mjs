#!/usr/bin/env node
// rule-35-auth-gate.mjs — verifica que o deploy.yml tem AUTH Gate (workflow_dispatch + frase de autorização)
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const deployYml = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');

const checks = [
  { name: 'workflow_dispatch trigger', pattern: /workflow_dispatch:/ },
  { name: 'auth_phrase input', pattern: /auth_phrase:/ },
  { name: 'AUTH Gate step name', pattern: /🔐 AUTH Gate/ },
  { name: 'frase exata de autorização', pattern: /Autorizo o deploy para produção/ },
  { name: 'condicional workflow_dispatch', pattern: /github\.event_name == 'workflow_dispatch'/ },
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  if (check.pattern.test(deployYml)) {
    console.log(`  ✅ ${check.name}`);
    passed++;
  } else {
    console.log(`  ❌ ${check.name}`);
    failed++;
  }
}

console.log(`\n📊 rule-35: ${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);