import type { SeatInput } from "./group_repo.ts";

export interface CsvParseError {
  line: number;
  reason: string;
}

export interface ParsedSeatCsv {
  seats: SeatInput[];
  lines: number[];
  errors: CsvParseError[];
}

const REQUIRED_HEADERS = ["groupId", "row", "col", "userId", "studentName", "label"];

function splitCsvLine(line: string): string[] {
  return line.split(",").map((v) => v.trim());
}

export function parseSeatCsv(groupId: string, csvText: string): ParsedSeatCsv {
  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const errors: CsvParseError[] = [];

  if (lines.length === 0 || lines[0].trim() === "") {
    return {
      seats: [],
      lines: [],
      errors: [{ line: 1, reason: "missing CSV header" }],
    };
  }

  const header = splitCsvLine(lines[0]);
  for (const required of REQUIRED_HEADERS) {
    if (!header.includes(required)) {
      errors.push({ line: 1, reason: `missing required header: ${required}` });
    }
  }
  if (errors.length > 0) return { seats: [], lines: [], errors };

  const headerIndex = new Map(header.map((name, idx) => [name, idx]));
  const seatRows: SeatInput[] = [];
  const seatLines: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine.trim() === "") continue;

    const cols = splitCsvLine(rawLine);
    const lineNo = i + 1;

    const rowValue = cols[headerIndex.get("row") ?? -1];
    const colValue = cols[headerIndex.get("col") ?? -1];
    const groupValue = cols[headerIndex.get("groupId") ?? -1];
    const userIdValue = cols[headerIndex.get("userId") ?? -1] || undefined;
    const labelValue = cols[headerIndex.get("label") ?? -1] || undefined;

    if (groupValue !== groupId) {
      errors.push({ line: lineNo, reason: `groupId mismatch: expected ${groupId}` });
      continue;
    }

    const row = Number.parseInt(rowValue, 10);
    const col = Number.parseInt(colValue, 10);

    if (!Number.isFinite(row) || !Number.isFinite(col)) {
      errors.push({ line: lineNo, reason: "row and col must be numbers" });
      continue;
    }

    seatRows.push({
      row,
      col,
      userId: userIdValue,
      label: labelValue,
    });
    seatLines.push(lineNo);
  }

  return {
    seats: seatRows,
    lines: seatLines,
    errors,
  };
}
