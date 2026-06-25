import { getKV } from "./kv.ts";
import type { ClassroomSeat, Group, GroupMember, Submission } from "./models.ts";

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
    displayName: input.teacherUserId,
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

export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const kv = await getKV();
  const members: GroupMember[] = [];
  for await (const entry of kv.list<GroupMember>({ prefix: ["group_members", groupId] })) {
    members.push(entry.value);
  }
  return members;
}

export async function listSeats(groupId: string): Promise<ClassroomSeat[]> {
  const kv = await getKV();
  const seats: ClassroomSeat[] = [];
  for await (const entry of kv.list<ClassroomSeat>({ prefix: ["classroom_seats", groupId] })) {
    seats.push(entry.value);
  }
  return seats.sort((a, b) => (a.row - b.row) || (a.col - b.col));
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
