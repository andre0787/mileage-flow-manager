import { parseOrigemTypeDescription } from "@/lib/origemTypes";
import type { OrigemType, EntryFormData } from "@/types";

interface UseEntryOrigemTypeHandlerParams {
  origemTypes: OrigemType[];
  formDate: string;
  formStartDate: string;
  formRecurrenceCount: number;
  recurrenceStartWasEdited: React.MutableRefObject<boolean>;
  set: (patch: Partial<EntryFormData>) => void;
  clearErr: (field: string) => void;
}

export function useEntryOrigemTypeHandler({
  origemTypes,
  formDate,
  formStartDate,
  formRecurrenceCount,
  recurrenceStartWasEdited,
  set,
  clearErr,
}: UseEntryOrigemTypeHandlerParams) {
  return (value: string) => {
    const selected = origemTypes.find((ot) => ot.id === value);
    const hasRecurrence = selected
      ? parseOrigemTypeDescription(selected.description).hasRecurrence
      : false;

    let startDate = formDate;
    if (hasRecurrence && recurrenceStartWasEdited.current) {
      startDate = formStartDate;
    }

    set({
      origemTypeId: value,
      isRecurrent: hasRecurrence,
      recurrenceCount: hasRecurrence ? Math.max(formRecurrenceCount, 2) : 1,
      startDate,
    });

    if (!hasRecurrence) {
      recurrenceStartWasEdited.current = false;
    }
    clearErr("origemTypeId");
  };
}
