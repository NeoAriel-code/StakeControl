import { FieldSource } from "@prisma/client";

type ProvenancedValue = string | Date | null | undefined;

function isSameValue(submittedValue: string | undefined, persistedValue: ProvenancedValue) {
  if (persistedValue instanceof Date) {
    return submittedValue !== undefined && new Date(submittedValue).getTime() === persistedValue.getTime();
  }

  return submittedValue === persistedValue;
}

export function resolveFieldSourceAfterEdit(
  submittedValue: string | undefined,
  persistedValue: ProvenancedValue,
  persistedSource: FieldSource | null | undefined
): FieldSource {
  return isSameValue(submittedValue, persistedValue)
    ? persistedSource ?? FieldSource.UNKNOWN
    : FieldSource.USER;
}
