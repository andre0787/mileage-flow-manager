/**
 * task-class-map.ts — Mapa taskId → ValidationTaskClass.
 *
 * Usado pelas análises (graph-roi) para agrupar runs por classe sem
 * duplicar a definição do dataset. Split para rule-41.
 */

import type { ValidationTaskClass } from "./types";

const MAP: Record<string, ValidationTaskClass> = {
  R8: "tiny",
  R9: "tiny",
  R1: "small",
  R4: "small",
  R5: "small",
  R7: "small",
  R10: "small",
  R15: "small",
  R21: "small",
  R2: "medium",
  R3: "medium",
  R6: "medium",
  R11: "medium",
  R12: "medium",
  R16: "medium",
  R18: "medium",
  R19: "medium",
  R22: "medium",
  R13: "large",
  R14: "large",
  R17: "large",
  R20: "large",
  R23: "large",
  R24: "architectural",
};

/** Classe de uma task pelo taskId (default medium — fail-open). */
export function classOfTask(taskId: string): ValidationTaskClass {
  return MAP[taskId] ?? "medium";
}
