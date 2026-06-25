import { getKV } from "./kv.ts";
import type { CaseResult, ClassroomSeat, Group, GroupMember, Problem, ProblemSample, Submission, TestCase } from "./models.ts";

export type SeatInput = {
  row: number;
  col: number;
  userId?: string;
  label?: string;
};

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function makeJoinCode(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
}

export async function createGroup(input: {
  name: string;
  teacherUserId: string;
  teacherDisplayName?: string;
  startsAt?: string;
  endsAt?: string;
}): Promise<Group> {
  const kv = await getKV();
  const group: Group = {
    id: newId("group"),
    name: input.name,
    joinCode: makeJoinCode(),
    teacherUserId: input.teacherUserId,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    isArchived: false,
    createdAt: new Date().toISOString(),
  };

  await kv.set(["groups", group.id], group);
  await kv.set(["groups_by_join_code", group.joinCode], group.id);

  const teacherMember: GroupMember = {
    id: newId("member"),
    groupId: group.id,
    userId: input.teacherUserId,
    role: "teacher",
    displayName: input.teacherDisplayName?.trim() || input.teacherUserId,
    joinedAt: new Date().toISOString(),
  };
  await kv.set(["group_members", group.id, input.teacherUserId], teacherMember);

  return group;
}

export async function listGroups(): Promise<Group[]> {
  const kv = await getKV();
  const groups: Group[] = [];
  for await (const entry of kv.list<Group>({ prefix: ["groups"] })) {
    groups.push(entry.value);
  }
  return groups.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const kv = await getKV();
  const result = await kv.get<Group>(["groups", groupId]);
  return result.value;
}

export async function getGroupByJoinCode(joinCode: string): Promise<Group | null> {
  const kv = await getKV();
  const groupIdEntry = await kv.get<string>(["groups_by_join_code", joinCode]);
  if (groupIdEntry.value === null) return null;

  const group = await kv.get<Group>(["groups", groupIdEntry.value]);
  return group.value;
}

export async function addStudentToGroup(params: {
  groupId: string;
  userId: string;
  displayName?: string;
}): Promise<GroupMember> {
  const kv = await getKV();
  const member: GroupMember = {
    id: newId("member"),
    groupId: params.groupId,
    userId: params.userId,
    role: "student",
    displayName: params.displayName ?? params.userId,
    joinedAt: new Date().toISOString(),
  };
  await kv.set(["group_members", params.groupId, params.userId], member);
  return member;
}

// 複数の学生を一括登録する（CSV一括インポート用）
export async function addStudentsToGroup(
  groupId: string,
  students: Array<{ userId: string; displayName?: string }>,
): Promise<GroupMember[]> {
  const kv = await getKV();
  const members: GroupMember[] = [];

  for (const student of students) {
    const member: GroupMember = {
      id: newId("member"),
      groupId,
      userId: student.userId,
      role: "student",
      displayName: student.displayName ?? student.userId,
      joinedAt: new Date().toISOString(),
    };
    members.push(member);
    await kv.set(["group_members", groupId, student.userId], member);
  }

  return members;
}

export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const kv = await getKV();
  const members: GroupMember[] = [];
  for await (const entry of kv.list<GroupMember>({ prefix: ["group_members", groupId] })) {
    members.push(entry.value);
  }
  return members;
}

export interface RosterUser {
  userId: string;
  displayName: string;
}

export interface Roster {
  teachers: RosterUser[];
  students: RosterUser[];
}

// 全グループのメンバーから、教員・学生の名簿を重複なしで取得する。
// 同一 userId が複数グループに存在しても 1 件に集約する。
export async function getRoster(): Promise<Roster> {
  const kv = await getKV();
  const teacherMap = new Map<string, string>();
  const studentMap = new Map<string, string>();

  for await (const entry of kv.list<GroupMember>({ prefix: ["group_members"] })) {
    const member = entry.value;
    const name = member.displayName?.trim() ? member.displayName.trim() : member.userId;
    const target = member.role === "teacher" ? teacherMap : studentMap;
    if (!target.has(member.userId)) target.set(member.userId, name);
  }

  const toList = (map: Map<string, string>): RosterUser[] =>
    [...map.entries()]
      .map(([userId, displayName]) => ({ userId, displayName }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));

  return { teachers: toList(teacherMap), students: toList(studentMap) };
}

export async function listSeats(groupId: string): Promise<ClassroomSeat[]> {
  const kv = await getKV();
  const seats: ClassroomSeat[] = [];
  for await (const entry of kv.list<ClassroomSeat>({ prefix: ["classroom_seats", groupId] })) {
    seats.push(entry.value);
  }
  return seats.sort((a, b) => (a.row - b.row) || (a.col - b.col));
}

export async function createProblem(input: {
  title: string;
  statement: string;
  inputSpec?: string;
  outputSpec?: string;
  constraints?: string;
  samples?: ProblemSample[];
  authorUserId: string;
}): Promise<Problem> {
  const kv = await getKV();
  const now = new Date().toISOString();

  const problem: Problem = {
    id: newId("problem"),
    title: input.title,
    statement: input.statement,
    inputSpec: input.inputSpec ?? "",
    outputSpec: input.outputSpec ?? "",
    constraints: input.constraints ?? "",
    samples: input.samples ?? [],
    status: "draft",
    authorUserId: input.authorUserId,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };

  await kv.set(["problems", problem.id], problem);
  return problem;
}

export async function getProblem(problemId: string): Promise<Problem | null> {
  const kv = await getKV();
  const result = await kv.get<Problem>(["problems", problemId]);
  return result.value;
}

export async function listProblems(params?: {
  includeArchived?: boolean;
  onlyPublished?: boolean;
}): Promise<Problem[]> {
  const kv = await getKV();
  const problems: Problem[] = [];

  for await (const entry of kv.list<Problem>({ prefix: ["problems"] })) {
    const problem = entry.value;
    if (!params?.includeArchived && problem.status === "archived") continue;
    if (params?.onlyPublished && problem.status !== "published") continue;
    problems.push(problem);
  }

  return problems.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function updateProblem(problemId: string, patch: {
  title?: string;
  statement?: string;
  inputSpec?: string;
  outputSpec?: string;
  constraints?: string;
  samples?: ProblemSample[];
}): Promise<Problem | null> {
  const kv = await getKV();
  const current = await getProblem(problemId);
  if (!current) return null;

  const next: Problem = {
    ...current,
    title: patch.title ?? current.title,
    statement: patch.statement ?? current.statement,
    inputSpec: patch.inputSpec ?? current.inputSpec,
    outputSpec: patch.outputSpec ?? current.outputSpec,
    constraints: patch.constraints ?? current.constraints,
    samples: patch.samples ?? current.samples,
    updatedAt: new Date().toISOString(),
  };

  await kv.set(["problems", problemId], next);
  return next;
}

export async function setProblemPublished(problemId: string, publish: boolean): Promise<Problem | null> {
  const kv = await getKV();
  const current = await getProblem(problemId);
  if (!current) return null;

  const next: Problem = {
    ...current,
    status: publish ? "published" : "draft",
    publishedAt: publish ? (current.publishedAt ?? new Date().toISOString()) : null,
    updatedAt: new Date().toISOString(),
  };

  await kv.set(["problems", problemId], next);
  return next;
}

export async function archiveProblem(problemId: string): Promise<Problem | null> {
  const kv = await getKV();
  const current = await getProblem(problemId);
  if (!current) return null;

  const next: Problem = {
    ...current,
    status: "archived",
    updatedAt: new Date().toISOString(),
  };

  await kv.set(["problems", problemId], next);
  return next;
}

// ─── TestCase ──────────────────────────────────────────────────────────────

export async function createTestCase(input: {
  problemId: string;
  input: string;
  expectedOutput: string;
  isPublic?: boolean;
  order?: number;
}): Promise<TestCase> {
  const kv = await getKV();
  const tc: TestCase = {
    id: newId("tc"),
    problemId: input.problemId,
    input: input.input,
    expectedOutput: input.expectedOutput,
    isPublic: input.isPublic ?? false,
    order: input.order ?? 0,
  };
  await kv.set(["test_cases", input.problemId, tc.id], tc);
  return tc;
}

export async function listTestCases(problemId: string): Promise<TestCase[]> {
  const kv = await getKV();
  const tcs: TestCase[] = [];
  for await (const entry of kv.list<TestCase>({ prefix: ["test_cases", problemId] })) {
    tcs.push(entry.value);
  }
  return tcs.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export async function getTestCase(problemId: string, testCaseId: string): Promise<TestCase | null> {
  const kv = await getKV();
  const result = await kv.get<TestCase>(["test_cases", problemId, testCaseId]);
  return result.value;
}

export async function updateTestCase(problemId: string, testCaseId: string, patch: {
  input?: string;
  expectedOutput?: string;
  isPublic?: boolean;
  order?: number;
}): Promise<TestCase | null> {
  const current = await getTestCase(problemId, testCaseId);
  if (!current) return null;
  const kv = await getKV();
  const next: TestCase = {
    ...current,
    input: patch.input ?? current.input,
    expectedOutput: patch.expectedOutput ?? current.expectedOutput,
    isPublic: patch.isPublic ?? current.isPublic,
    order: patch.order ?? current.order,
  };
  await kv.set(["test_cases", problemId, testCaseId], next);
  return next;
}

export async function deleteTestCase(problemId: string, testCaseId: string): Promise<boolean> {
  const kv = await getKV();
  const existing = await getTestCase(problemId, testCaseId);
  if (!existing) return false;
  await kv.delete(["test_cases", problemId, testCaseId]);
  return true;
}

// ─── CaseResult ────────────────────────────────────────────────────────────

export async function saveCaseResult(result: Omit<CaseResult, "id">): Promise<CaseResult> {
  const kv = await getKV();
  const cr: CaseResult = { id: newId("cr"), ...result };
  await kv.set(["case_results", result.submissionId, cr.id], cr);
  return cr;
}

export async function listCaseResults(submissionId: string): Promise<CaseResult[]> {
  const kv = await getKV();
  const results: CaseResult[] = [];
  for await (const entry of kv.list<CaseResult>({ prefix: ["case_results", submissionId] })) {
    results.push(entry.value);
  }
  return results.sort((a, b) => a.id.localeCompare(b.id));
}

export async function updateSubmissionStatus(
  submissionId: string,
  patch: {
    status: Submission["status"];
    verdict?: Submission["verdict"];
    compileOutput?: string;
    finishedAt?: string;
  },
): Promise<void> {
  const kv = await getKV();
  const result = await kv.get<Submission>(["submissions", submissionId]);
  if (!result.value) return;
  const next: Submission = {
    ...result.value,
    status: patch.status,
    verdict: patch.verdict !== undefined ? patch.verdict : result.value.verdict,
    compileOutput: patch.compileOutput ?? result.value.compileOutput,
    finishedAt: patch.finishedAt ?? result.value.finishedAt,
  };
  await kv.set(["submissions", submissionId], next);
}

export async function upsertSeats(groupId: string, seats: SeatInput[]): Promise<number> {
  const kv = await getKV();
  let updatedCount = 0;

  for (const seat of seats) {
    const key = ["classroom_seats", groupId, `${seat.row}:${seat.col}`];
    const value: ClassroomSeat = {
      id: newId("seat"),
      groupId,
      row: seat.row,
      col: seat.col,
      userId: seat.userId ?? null,
      label: seat.label ?? null,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(key, value);
    updatedCount += 1;
  }

  return updatedCount;
}

export async function listSubmissions(params: {
  groupId?: string;
  problemId?: string;
  userId?: string;
  verdict?: string;
}): Promise<Submission[]> {
  const kv = await getKV();
  const submissions: Submission[] = [];

  for await (const entry of kv.list<Submission>({ prefix: ["submissions"] })) {
    const s = entry.value;
    if (params.groupId && s.groupId !== params.groupId) continue;
    if (params.problemId && s.problemId !== params.problemId) continue;
    if (params.userId && s.userId !== params.userId) continue;
    if (params.verdict && s.verdict !== params.verdict) continue;
    submissions.push(s);
  }

  return submissions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getSubmissionById(submissionId: string): Promise<Submission | null> {
  const kv = await getKV();
  const result = await kv.get<Submission>(["submissions", submissionId]);
  return result.value;
}

export async function createSubmission(input: {
  userId: string;
  groupId: string | null;
  problemId: string;
  language?: "c";
  sourceCode?: string;
  status?: "QUEUED" | "RUNNING" | "DONE" | "ERROR";
  verdict?: Submission["verdict"];
  compileOutput?: string;
  createdAt?: string;
  finishedAt?: string | null;
}): Promise<Submission> {
  const kv = await getKV();
  const submission: Submission = {
    id: `sub_${crypto.randomUUID()}`,
    userId: input.userId,
    groupId: input.groupId,
    problemId: input.problemId,
    language: input.language ?? "c",
    sourceCode: input.sourceCode ?? "int main(){return 0;}",
    status: input.status ?? "DONE",
    verdict: input.verdict ?? null,
    compileOutput: input.compileOutput ?? "",
    createdAt: input.createdAt ?? new Date().toISOString(),
    finishedAt: input.finishedAt ?? new Date().toISOString(),
  };

  await kv.set(["submissions", submission.id], submission);
  return submission;
}
