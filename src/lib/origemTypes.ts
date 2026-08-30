import { addMonthsClamped } from "@/lib/dateUtils";

/** Serializa metadata de origem type (distinto do serializeDescription em types/index.ts que é para entries) */
export function serializeOrigemTypeDescription(hasRecurrence: boolean): string {
  return JSON.stringify({ hasRecurrence });
}

export function parseOrigemTypeDescription(description?: string | null): {
  hasRecurrence: boolean;
} {
  if (!description) return { hasRecurrence: false };

  try {
    const parsed = JSON.parse(description) as {
      hasRecurrence?: boolean;
      recurrenceInterval?: number;
    };
    return { hasRecurrence: Boolean(parsed.hasRecurrence || parsed.recurrenceInterval) };
  } catch {
    return { hasRecurrence: false };
  }
}

/**
 * Sanitização defensiva de nomes de tipos de origem (sem DELETE em banco).
 * Marca como sujeira nomes vazios/whitespace e padrões óbvios de teste/lixo.
 */
const JUNK_PATTERNS = [
  /^n\/a$/i,
  /^na$/i,
  /^teste$/i,
  /^test$/i,
  /^e2e_/i,
  /e2e/i,
  /lixo/i,
  /sujeira/i,
];

export function isJunkOrigemTypeName(name: string | null | undefined): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed) return true;
  return JUNK_PATTERNS.some((re) => re.test(trimmed));
}

/** Remove duplicatas case-insensitive mantendo a primeira ocorrência (sem mutar). */
export function dedupeOrigemTypes<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/** Filtra sujeira E duplicatas em uma passada (sem mutar). */
export function filterToCleanOrigemTypes<T extends { name: string }>(items: T[]): T[] {
  return dedupeOrigemTypes(items.filter((item) => !isJunkOrigemTypeName(item.name)));
}

export function buildMonthlyRecurrence(
  enabled: boolean,
  months?: string,
  startDate?: string,
): {
  recurrenceInterval?: number;
  recurrenceEnd?: string;
} {
  if (!enabled) return {};

  const parsedMonths = Number.parseInt(months ?? "", 10);
  if (!Number.isFinite(parsedMonths) || parsedMonths <= 0) {
    return { recurrenceInterval: 30 };
  }

  const recurrenceEnd = startDate
    ? addMonthsClamped(startDate, parsedMonths, new Date(`${startDate}T00:00:00Z`).getUTCDate())
    : (() => {
        const todayISO = new Date().toISOString().split("T")[0];
        return addMonthsClamped(todayISO, parsedMonths);
      })();
  return {
    recurrenceInterval: 30,
    recurrenceEnd,
  };
}
