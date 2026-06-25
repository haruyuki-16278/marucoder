import type { SeatInput } from "./group_repo.ts";

export interface SeatValidationError {
  line: number | null;
  reason: string;
}

export function validateSeatInputs(
  seats: SeatInput[],
  validUserIds: Set<string>,
  lines?: number[],
): SeatValidationError[] {
  const errors: SeatValidationError[] = [];
  const keyMap = new Map<string, number[]>();

  seats.forEach((seat, index) => {
    const line = lines?.[index] ?? null;

    if (!Number.isInteger(seat.row) || seat.row < 1 || seat.row > 100) {
      errors.push({ line, reason: "row must be an integer between 1 and 100" });
    }

    if (!Number.isInteger(seat.col) || seat.col < 1 || seat.col > 100) {
      errors.push({ line, reason: "col must be an integer between 1 and 100" });
    }

    if (seat.userId && !validUserIds.has(seat.userId)) {
      errors.push({ line, reason: `userId is not a member of this group: ${seat.userId}` });
    }

    const key = `${seat.row}:${seat.col}`;
    keyMap.set(key, [...(keyMap.get(key) ?? []), index]);
  });

  for (const [key, indexes] of keyMap.entries()) {
    if (indexes.length <= 1) continue;
    for (const idx of indexes) {
      const line = lines?.[idx] ?? null;
      errors.push({ line, reason: `duplicate seat coordinates: ${key}` });
    }
  }

  return errors;
}
