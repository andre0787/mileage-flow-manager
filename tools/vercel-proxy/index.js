#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['vercel@54.18.5', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
