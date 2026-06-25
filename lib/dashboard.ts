import type { ProgressSnapshot, SeatProgress } from "./models.ts";
import { listGroupMembers, listGroups, listSeats, listSubmissions } from "./group_repo.ts";

export function aggregateGroupProgress(params: {
  groupId: string;
  groupName: string;
  problemId: string;
  studentUserIds: string[];
  submissions: Array<{ userId: string; verdict: string | null; createdAt: string }>;
}): ProgressSnapshot {
  const submitted = new Set(params.submissions.map((s) => s.userId));
  const acUsers = new Set(
    params.submissions.filter((s) => s.verdict === "AC").map((s) => s.userId),
  );

  const totalStudents = params.studentUserIds.length;
  const acStudents = acUsers.size;
  const lastSubmissionAt = params.submissions.at(-1)?.createdAt ?? null;

  return {
    groupId: params.groupId,
    groupName: params.groupName,
    problemId: params.problemId,
    totalStudents,
    submittedStudents: submitted.size,
    acStudents,
    progressRate: totalStudents === 0 ? 0 : acStudents / totalStudents,
    lastSubmissionAt,
  };
}

export async function buildGroupProgress(problemId: string): Promise<ProgressSnapshot[]> {
  const groups = await listGroups();
  const snapshots: ProgressSnapshot[] = [];

  for (const group of groups) {
    const members = await listGroupMembers(group.id);
    const students = members.filter((m) => m.role === "student");
    const submissions = await listSubmissions({ groupId: group.id, problemId });

    snapshots.push(
      aggregateGroupProgress({
        groupId: group.id,
        groupName: group.name,
        problemId,
        studentUserIds: students.map((s) => s.userId),
        submissions,
      }),
    );
  }

  return snapshots;
}

export async function buildSeatProgress(groupId: string, problemId: string): Promise<SeatProgress[]> {
  const [seats, members, submissions] = await Promise.all([
    listSeats(groupId),
    listGroupMembers(groupId),
    listSubmissions({ groupId, problemId }),
  ]);

  const memberMap = new Map(members.map((m) => [m.userId, m]));

  return seats.map((seat) => {
    if (!seat.userId) {
      return {
        groupId,
        problemId,
        row: seat.row,
        col: seat.col,
        userId: null,
        studentName: null,
        latestVerdict: "NONE",
        submissionCount: 0,
        lastSubmittedAt: null,
      };
    }

    const userSubmissions = submissions.filter((s) => s.userId === seat.userId);
    const latest = userSubmissions.at(-1);
    const name = memberMap.get(seat.userId)?.displayName ?? seat.userId;

    return {
      groupId,
      problemId,
      row: seat.row,
      col: seat.col,
      userId: seat.userId,
      studentName: name,
      latestVerdict: latest?.verdict ?? "NONE",
      submissionCount: userSubmissions.length,
      lastSubmittedAt: latest?.createdAt ?? null,
    };
  });
}
