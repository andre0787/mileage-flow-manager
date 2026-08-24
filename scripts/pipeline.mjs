#!/usr/bin/env node
/**
 * SDD-03 — pipeline determinístico de quatro etapas.
 *
 * Cada etapa devolve um contrato JSON serializável. Nenhuma etapa grava
 * arquivos: isso evita que o pipeline produza schemas TypeScript inválidos,
 * diffs fictícios ou testes que não pertencem ao repositório.
 */

import { execFileSync } from "child_process";

const STAGES = ["schema-gen", "code-implementer", "test-writer", "pre-pr-check"];
const TASK_CATEGORIES = ["feature", "bugfix", "docs", "refactor", "chore"];
const TASK_STATUSES = ["pending", "in-progress", "done"];

function jsonContract(value) {
  // Round-trip explícito: uma etapa só pode avançar com JSON válido.
  return JSON.parse(JSON.stringify(value));
}

function runSchemaGen(taskDescription) {
  if (!taskDescription || !taskDescription.trim()) {
    throw new Error("schema-gen exige uma descrição de task não vazia");
  }
  return jsonContract({
    stage: "schema-gen",
    contract: "task-card-schema",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      additionalProperties: false,
      required: ["id", "title", "description", "category", "status"],
      properties: {
        id: { type: "string", minLength: 1 },
        title: { type: "string", minLength: 1 },
        description: { type: "string", minLength: 1 },
        category: { type: "string", enum: TASK_CATEGORIES },
        status: { type: "string", enum: TASK_STATUSES },
      },
    },
    taskDescription: taskDescription.trim(),
    status: "ready",
  });
}

function runCodeImplementer(schemaContract, codeSnippet = "") {
  if (!schemaContract?.schema || schemaContract.contract !== "task-card-schema") {
    throw new Error("code-implementer recebeu um contrato de schema inválido");
  }
  const relevantLines = String(codeSnippet)
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("//")).length;
  return jsonContract({
    stage: "code-implementer",
    contract: "implementation-plan",
    input: { schemaContract: "task-card-schema", relevantLines },
    // O implementador só descreve o diff; não produz código nem toca no disco.
    diff: [],
    status: "ready",
  });
}

function runTestWriter(implementationContract) {
  if (!implementationContract || implementationContract.contract !== "implementation-plan") {
    throw new Error("test-writer recebeu um contrato de implementação inválido");
  }
  return jsonContract({
    stage: "test-writer",
    contract: "test-plan",
    input: "implementation-plan",
    // O escritor só descreve testes; o diff permanece isolado na etapa anterior.
    test: [
      { name: "accepts a valid task card", expected: true },
      { name: "rejects a task card missing required fields", expected: false },
    ],
    status: "ready",
  });
}

function runPrePrCheck() {
  const checks = [];
  for (const script of ["typecheck", "lint", "format:check"]) {
    try {
      execFileSync("npm", ["run", script, "--silent"], {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, CI: "1" },
      });
      checks.push({ name: script, status: "passed" });
    } catch (error) {
      checks.push({
        name: script,
        status: "failed",
        output: `${error.stdout || ""}${error.stderr || ""}`.trim().slice(-1000),
      });
    }
  }
  return jsonContract({
    stage: "pre-pr-check",
    contract: "pre-pr-result",
    checks,
    status: checks.every((check) => check.status === "passed") ? "passed" : "failed",
  });
}

function runPipeline(taskDescription, codeSnippet = "") {
  const stages = [];
  const schema = runSchemaGen(taskDescription);
  stages.push(schema);
  const implementation = runCodeImplementer(schema, codeSnippet);
  stages.push(implementation);
  const tests = runTestWriter(implementation);
  stages.push(tests);
  const prePr = runPrePrCheck();
  stages.push(prePr);
  return jsonContract({ contract: "pipeline-result", stages });
}

function parseSchemaArgument(argument) {
  try {
    return JSON.parse(argument);
  } catch {
    throw new Error("code-implementer exige schema JSON válido como primeiro argumento");
  }
}

function main() {
  const [stage, ...args] = process.argv.slice(2);
  let result;
  if (!stage) throw new Error("pipeline exige descrição da task");
  if (STAGES.includes(stage) && stage !== "pre-pr-check") {
    if (stage === "schema-gen") result = runSchemaGen(args.join(" "));
    else if (stage === "code-implementer") result = runCodeImplementer(parseSchemaArgument(args[0]), args.slice(1).join(" "));
    else result = runTestWriter(JSON.parse(args[0] || "{}"));
  } else if (stage === "pre-pr-check") {
    result = runPrePrCheck();
  } else {
    result = runPipeline([stage, ...args].join(" "));
  }
  console.log(JSON.stringify(result));
  if (result.status === "failed" || result.stages?.at(-1)?.status === "failed") process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(`❌ Pipeline error: ${error.message}`);
  process.exitCode = 1;
}
