import type { EntryFormData } from '@/components/EntryForm';
import { buildMonthlyRecurrence } from '@/lib/origemTypes';

/**
 * Calculate recurrence interval (in days) and end date based on form values.
 * Returns undefined for both if recurrence is not active or only single occurrence.
 */
export function calculateRecurrence(form: Pick<
  EntryFormData,
  | 'isRecurrent'
  | 'recurrenceCount'
  | 'recurrenceType'
  | 'date'
  | 'isClube'
  | 'clubeMeses'
>): { recurrenceInterval?: number; recurrenceEnd?: string } {
  // If recurrence not enabled, fallback to clube (legacy) behavior
  if (!form.isRecurrent) {
    return buildMonthlyRecurrence(form.isClube, form.clubeMeses);
  }

  // If recurrence enabled but only 1 occurrence, treat as no recurrence
  if (form.recurrenceCount < 2) {
    return {};
  }

  const type = form.recurrenceType as
    | 'monthly'
    | 'quarterly'
    | 'semiannual'
    | 'annual';
  const intervalMap = { monthly: 30, quarterly: 90, semiannual: 180, annual: 365 };
  const interval = intervalMap[type];
  const startDate = new Date(form.date);
  const endDate = new Date(
    startDate.getTime() + interval * 24 * 60 * 60 * 1000 * form.recurrenceCount
  );
  return {
    recurrenceInterval: interval,
    recurrenceEnd: endDate.toISOString().split('T')[0],
  };
}