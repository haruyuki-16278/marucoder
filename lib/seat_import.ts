import type { SeatInput } from "./group_repo.ts";
import { parseSeatCsv } from "./seat_csv.ts";
import { validateSeatInputs } from "./seat_validation.ts";

export interface SeatImportError {
  line: number;
  reason: string;
}

export interface SeatImportResult {
  acceptedCount: number;
  acceptedSeats: SeatInput[];
  errorCount: number;
  errors: SeatImportError[];
}

export function buildSeatImportResult(
  groupId: string,
  csvText: string,
  validUserIds: Set<string>,
): SeatImportResult {
  const parsed = parseSeatCsv(groupId, csvText);

  const validationErrors = validateSeatInputs(parsed.seats, validUserIds, parsed.lines).map((error) => ({
    line: error.line ?? 0,
    reason: error.reason,
  }));

  const allErrors = [...parsed.errors, ...validationErrors].sort((a, b) => a.line - b.line);
  const invalidLines = new Set(allErrors.map((error) => error.line));
  const acceptedSeats = parsed.seats.filter((_, index) => !invalidLines.has(parsed.lines[index]));

  return {
    acceptedCount: parsed.seats.length,
    acceptedSeats,
    errorCount: allErrors.length,
    errors: allErrors,
  };
}
