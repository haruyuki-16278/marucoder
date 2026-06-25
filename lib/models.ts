export type Role = "teacher" | "student";
export type Verdict = "AC" | "WA" | "TLE" | "RE" | "CE" | "IE";
export type ProblemStatus = "draft" | "published" | "archived";

export interface ProblemSample {
  input: string;
  output: string;
}

export interface Problem {
  id: string;
  title: string;
  statement: string;
  inputSpec: string;
  outputSpec: string;
  constraints: string;
  samples: ProblemSample[];
  status: ProblemStatus;
  authorUserId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface TestCase {
  id: string;
  problemId: string;
  input: string;
  expectedOutput: string;
  isPublic: boolean;
  order: number;
}

export interface CaseResult {
  id: string;
  submissionId: string;
  testCaseId: string;
  verdict: "AC" | "WA" | "TLE" | "RE";
  exitCode: number;
  timeMs: number;
  stdout: string;
  stderr: string;
}

export interface Group {
  id: string;
  name: string;
  joinCode: string;
  teacherUserId: string;
  startsAt: string | null;
  endsAt: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: Role;
  displayName?: string;
  joinedAt: string;
}

export interface ClassroomSeat {
  id: string;
  groupId: string;
  row: number;
  col: number;
  userId: string | null;
  label: string | null;
  updatedAt: string;
}

export interface Submission {
  id: string;
  userId: string;
  groupId: string | null;
  problemId: string;
  language: "c";
  sourceCode: string;
  status: "QUEUED" | "RUNNING" | "DONE" | "ERROR";
  verdict: Verdict | null;
  compileOutput: string;
  createdAt: string;
  finishedAt: string | null;
}

export interface ProgressSnapshot {
  groupId: string;
  groupName: string;
  problemId: string;
  totalStudents: number;
  submittedStudents: number;
  acStudents: number;
  progressRate: number;
  lastSubmissionAt: string | null;
}

export interface SeatProgress {
  groupId: string;
  problemId: string;
  row: number;
  col: number;
  userId: string | null;
  studentName: string | null;
  latestVerdict: Verdict | "NONE";
  submissionCount: number;
  lastSubmittedAt: string | null;
}
