export const TEACHER_INITIAL_PASSWORD = "marugoto2026";

export function normalizeRoma(text: string): string {
  return text.trim().toLowerCase();
}

export function isTeacherUsernameValid(username: string): boolean {
  return /^[a-z]+\.[a-z]+$/.test(username);
}

export function makeTeacherUsername(lastNameRoma: string, firstNameRoma: string): string {
  const username = `${normalizeRoma(lastNameRoma)}.${normalizeRoma(firstNameRoma)}`;
  if (!isTeacherUsernameValid(username)) {
    throw new Error("invalid teacher username format");
  }
  return username;
}

export function makeStudentUsername(grade: number, attendanceNo: number): string {
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) {
    throw new Error("grade must be 1-9");
  }
  if (!Number.isInteger(attendanceNo) || attendanceNo < 0 || attendanceNo > 99) {
    throw new Error("attendanceNo must be 0-99");
  }
  return `${grade}${String(attendanceNo).padStart(2, "0")}`;
}

export function makeStudentInitialPassword(attendanceNo: number): string {
  if (!Number.isInteger(attendanceNo) || attendanceNo < 0 || attendanceNo > 99) {
    throw new Error("attendanceNo must be 0-99");
  }
  return `marugoto${String(attendanceNo).padStart(2, "0")}`;
}
