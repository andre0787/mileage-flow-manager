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

export function buildMonthlyRecurrence(
  enabled: boolean,
  months?: string,
): {
  recurrenceInterval?: number;
  recurrenceEnd?: string;
} {
  if (!enabled) return {};

  const parsedMonths = Number.parseInt(months ?? "", 10);
  if (!Number.isFinite(parsedMonths) || parsedMonths <= 0) {
    return { recurrenceInterval: 30 };
  }

  const endDate = new Date();
  // ponytail: UTC para consistência com datas ISO
  endDate.setUTCMonth(endDate.getUTCMonth() + parsedMonths);
  return {
    recurrenceInterval: 30,
    recurrenceEnd: endDate.toISOString().split("T")[0],
  };
}
