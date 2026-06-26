import { hashPassword } from "./password.ts";
import { createUser } from "./user_repo.ts";
import {
  isTeacherUsernameValid,
  makeStudentInitialPassword,
  makeStudentUsername,
  makeTeacherUsername,
  TEACHER_INITIAL_PASSWORD,
} from "./user_rules.ts";

export type ImportFailure = {
  line: number;
  reason: string;
};

export type ImportReport = {
  successCount: number;
  failedCount: number;
  failures: ImportFailure[];
};

function lines(csv: string): string[] {
  return csv.replace(/\r\n/g, "\n").split("\n").map((x) => x.trim()).filter(Boolean);
}

export async function importTeachersCsv(csv: string): Promise<ImportReport> {
  const rows = lines(csv);
  if (rows.length === 0) {
    return { successCount: 0, failedCount: 1, failures: [{ line: 1, reason: "CSV is empty" }] };
  }
  if (rows[0] !== "lastNameRoma,firstNameRoma,email") {
    return {
      successCount: 0,
      failedCount: 1,
      failures: [{ line: 1, reason: "header must be lastNameRoma,firstNameRoma,email" }],
    };
  }

  const failures: ImportFailure[] = [];
  let successCount = 0;
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const lineNo = i + 1;
    const [lastNameRoma = "", firstNameRoma = "", email = ""] = rows[i].split(",").map((s) => s.trim());

    try {
      const username = makeTeacherUsername(lastNameRoma, firstNameRoma);
      if (!isTeacherUsernameValid(username)) {
        failures.push({ line: lineNo, reason: "username contains invalid characters" });
        continue;
      }
      if (seen.has(username)) {
        failures.push({ line: lineNo, reason: "duplicate username in CSV" });
        continue;
      }
      seen.add(username);

      const passwordHash = await hashPassword(TEACHER_INITIAL_PASSWORD);
      const created = await createUser({
        username,
        role: "teacher",
        email,
        passwordHash,
        mustChangePassword: true,
      });
      if (!created.ok) {
        failures.push({ line: lineNo, reason: created.reason });
        continue;
      }
      successCount++;
    } catch (err) {
      failures.push({ line: lineNo, reason: err instanceof Error ? err.message : "invalid row" });
    }
  }

  return { successCount, failedCount: failures.length, failures };
}

export async function importStudentsCsv(csv: string): Promise<ImportReport> {
  const rows = lines(csv);
  if (rows.length === 0) {
    return { successCount: 0, failedCount: 1, failures: [{ line: 1, reason: "CSV is empty" }] };
  }
  if (rows[0] !== "grade,attendanceNo") {
    return {
      successCount: 0,
      failedCount: 1,
      failures: [{ line: 1, reason: "header must be grade,attendanceNo" }],
    };
  }

  const failures: ImportFailure[] = [];
  let successCount = 0;
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const lineNo = i + 1;
    const [gradeText = "", attendanceText = ""] = rows[i].split(",").map((s) => s.trim());

    const grade = Number.parseInt(gradeText, 10);
    const attendanceNo = Number.parseInt(attendanceText, 10);

    try {
      const username = makeStudentUsername(grade, attendanceNo);
      if (seen.has(username)) {
        failures.push({ line: lineNo, reason: "duplicate username in CSV" });
        continue;
      }
      seen.add(username);

      const passwordHash = await hashPassword(makeStudentInitialPassword(attendanceNo));
      const created = await createUser({
        username,
        role: "student",
        passwordHash,
        mustChangePassword: true,
      });
      if (!created.ok) {
        failures.push({ line: lineNo, reason: created.reason });
        continue;
      }
      successCount++;
    } catch (err) {
      failures.push({ line: lineNo, reason: err instanceof Error ? err.message : "invalid row" });
    }
  }

  return { successCount, failedCount: failures.length, failures };
}
