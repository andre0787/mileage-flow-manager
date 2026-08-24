import type { EntryFormData } from "@/types";
import { buildMonthlyRecurrence } from "@/lib/origemTypes";
import { addMonthsClamped } from "@/lib/dateUtils";

/**
 * Calculate recurrence interval (in days) and end date based on form values.
 * Returns undefined for both if recurrence is not active or only single occurrence.
 */
export function calculateRecurrence(
  form: Pick<
    EntryFormData,
    | "isRecurrent"
    | "recurrenceCount"
    | "recurrenceType"
    | "date"
    | "startDate"
    | "isClube"
    | "clubeMeses"
    | "recurrenceValueMode"
  >,
): {
  recurrenceInterval?: number;
  recurrenceEnd?: string;
  recurrenceValueMode?: "split" | "repeat";
  recurrenceDayOfMonth?: number;
} {
  // If recurrence not enabled, fallback to clube (legacy) behavior
  if (!form.isRecurrent) {
    return buildMonthlyRecurrence(form.isClube, form.clubeMeses);
  }

  // If recurrence enabled but only 1 occurrence, treat as no recurrence
  if (form.recurrenceCount < 2) {
    return {};
  }

  const type = form.recurrenceType as "monthly" | "quarterly" | "semiannual" | "annual";
  const monthsMap = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 };
  const monthsPerPeriod = monthsMap[type];
  // ponytail: usar UTC para evitar off-by-one em timezones negativos (ex: Brasil UTC-3)
  const recurrenceStart = form.startDate || form.date;
  const startDate = new Date(`${recurrenceStart}T00:00:00Z`);
  return {
    recurrenceInterval: 30, // mantido para compatibilidade com dados legados
    recurrenceEnd: addMonthsClamped(
      recurrenceStart,
      monthsPerPeriod * form.recurrenceCount,
      startDate.getUTCDate(),
    ),
    recurrenceValueMode: form.recurrenceValueMode,
    recurrenceDayOfMonth: startDate.getUTCDate(),
  };
}
