/**
 * dataset.ts — P12-01 Real Task Dataset (barrel).
 *
 * Tasks reais do repositório (bugs/issues reais, módulos existentes) com os
 * campos obrigatórios da spec §P12-01. Dividido em 3 partes para respeitar o
 * hard limit de 150 linhas (rule-41):
 *   dataset-base.ts (R1-R6) · dataset-mid.ts (R7-R12) · dataset-extra.ts (R13-R24)
 */

import type { RealTask } from "./types";
import { BASE_TASKS } from "./dataset-base";
import { MID_TASKS } from "./dataset-mid";
import { EXTRA2_TASKS } from "./dataset-extra2";
import { EXTRA_TASKS } from "./dataset-extra";

/** Dataset canônico da P12: R1-R24. */
export const REAL_TASK_DATASET: RealTask[] = [
  ...BASE_TASKS,
  ...MID_TASKS,
  ...EXTRA2_TASKS,
  ...EXTRA_TASKS,
];

export { BASE_TASKS, MID_TASKS, EXTRA2_TASKS, EXTRA_TASKS };
