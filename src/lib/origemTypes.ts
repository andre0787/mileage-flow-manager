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

  return {
    recurrenceInterval: 30,
    recurrenceEnd: new Date(Date.now() + parsedMonths * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  };
}
