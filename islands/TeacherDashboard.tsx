import { useEffect, useMemo, useState } from "preact/hooks";
import type { Problem, ProgressSnapshot, SeatProgress } from "../lib/models.ts";

type Props = {
  initialProblemId: string;
};

type ImportError = {
  line: number;
  reason: string;
};

export default function TeacherDashboard({ initialProblemId }: Props) {
  const [problemId, setProblemId] = useState(initialProblemId || "A-01");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [snapshots, setSnapshots] = useState<ProgressSnapshot[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [seats, setSeats] = useState<SeatProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [formRow, setFormRow] = useState("1");
  const [formCol, setFormCol] = useState("1");
  const [formUserId, setFormUserId] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [csvText, setCsvText] = useState("groupId,row,col,userId,studentName,label\n");
  const [actionMessage, setActionMessage] = useState("");
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  const selectedGroup = useMemo(
    () => snapshots.find((s) => s.groupId === selectedGroupId),
    [snapshots, selectedGroupId],
  );

  async function loadSnapshots(targetProblemId: string) {
    const res = await fetch(`/api/dashboard/groups?problemId=${encodeURIComponent(targetProblemId)}`);
    if (!res.ok) throw new Error(`progress fetch failed: ${res.status}`);
    const data = await res.json() as ProgressSnapshot[];
    setSnapshots(data);

    if (data.length === 0) {
      setSelectedGroupId("");
      setSeats([]);
      return;
    }

    const exists = data.some((item) => item.groupId === selectedGroupId);
    if (!exists) setSelectedGroupId(data[0].groupId);
  }

  async function loadProblems() {
    const res = await fetch("/api/problems");
    if (!res.ok) throw new Error(`problem fetch failed: ${res.status}`);
    const data = await res.json() as Problem[];
    setProblems(data);

    if (data.length === 0) return;
    const exists = data.some((problem) => problem.id === problemId);
    if (!exists) {
      setProblemId(data[0].id);
    }
  }

  async function loadSeats(groupId: string, targetProblemId: string) {
    if (!groupId) {
      setSeats([]);
      return;
    }

    const res = await fetch(
      `/api/dashboard/groups/${encodeURIComponent(groupId)}/seats?problemId=${encodeURIComponent(targetProblemId)}`,
    );
    if (!res.ok) throw new Error(`seats fetch failed: ${res.status}`);

    const data = await res.json() as SeatProgress[];
    setSeats(data);
  }

  async function reloadAll() {
    if (!problemId) return;
    setLoading(true);
    setError("");

    try {
      await loadSnapshots(problemId);
      const currentGroup = selectedGroupId || snapshots[0]?.groupId || "";
      if (currentGroup) {
        await loadSeats(currentGroup, problemId);
      }
      setUpdatedAt(new Date().toLocaleTimeString("ja-JP"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProblems().catch((e) => {
      setError(e instanceof Error ? e.message : "unknown error");
    });
  }, []);

  useEffect(() => {
    if (!problemId) return;
    reloadAll();
    const timer = setInterval(() => {
      reloadAll();
    }, 10_000);

    return () => clearInterval(timer);
  }, [problemId]);

  useEffect(() => {
    if (!selectedGroupId) return;
    loadSeats(selectedGroupId, problemId).catch((e) => {
      setError(e instanceof Error ? e.message : "unknown error");
    });
  }, [selectedGroupId, problemId]);

  async function submitSeatUpdate(e: Event) {
    e.preventDefault();
    if (!selectedGroupId) return;

    setActionMessage("更新中...");
    const payload = {
      seats: [{
        row: Number.parseInt(formRow, 10),
        col: Number.parseInt(formCol, 10),
        userId: formUserId.trim() || undefined,
        label: formLabel.trim() || undefined,
      }],
    };

    const res = await fetch(`/api/groups/${encodeURIComponent(selectedGroupId)}/seats`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setActionMessage(`更新失敗: ${data.message ?? data.code ?? "unknown"}`);
      return;
    }

    setActionMessage(`更新成功: ${data.updatedCount} 件`);
    await loadSeats(selectedGroupId, problemId);
  }

  async function submitCsvImport(e: Event) {
    e.preventDefault();
    if (!selectedGroupId) return;

    setActionMessage("CSV取込中...");
    const res = await fetch(`/api/groups/${encodeURIComponent(selectedGroupId)}/seats/import`, {
      method: "POST",
      headers: { "content-type": "text/csv" },
      body: csvText,
    });

    const data = await res.json();
    if (!res.ok) {
      setActionMessage(`CSV取込失敗: ${data.message ?? data.code ?? "unknown"}`);
      setImportErrors([]);
      return;
    }

    setActionMessage(`CSV取込: 更新 ${data.updatedCount} 件 / エラー ${data.errorCount} 件`);
    setImportErrors((data.errors ?? []) as ImportError[]);
    await loadSeats(selectedGroupId, problemId);
  }

  const maxRow = Math.max(...seats.map((s) => s.row), 0);
  const maxCol = Math.max(...seats.map((s) => s.col), 0);
  const seatMap = new Map(seats.map((seat) => [`${seat.row}:${seat.col}`, seat]));

  return (
    <div class="mx-auto max-w-6xl px-4 py-6">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <h1 class="text-xl font-bold">教卓進捗ダッシュボード</h1>
        <label class="text-sm">課題ID:</label>
        <select
          class="rounded border border-slate-300 px-2 py-1 text-sm"
          value={problemId}
          onChange={(e) => setProblemId((e.target as HTMLSelectElement).value)}
        >
          {problems.length === 0 && <option value="">問題なし</option>}
          {problems.map((problem) => (
            <option key={problem.id} value={problem.id}>
              {problem.title} ({problem.id})
            </option>
          ))}
        </select>
        <button class="rounded bg-slate-900 px-3 py-1 text-sm text-white" onClick={reloadAll}>再取得</button>
        <span class="text-sm text-slate-600">最終更新: {updatedAt || "-"}</span>
        {loading && <span class="text-sm text-slate-500">更新中...</span>}
      </div>

      {error && (
        <div class="mb-4 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div class="grid gap-4 md:grid-cols-2">
        <section class="rounded border border-slate-200 bg-white p-3">
          <h2 class="mb-2 font-semibold">グループ進捗テーブル</h2>
          <div class="overflow-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-left">
                  <th class="py-2">Group</th>
                  <th class="py-2">人数</th>
                  <th class="py-2">AC/提出</th>
                  <th class="py-2">進捗率</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => {
                  const selected = s.groupId === selectedGroupId;
                  return (
                    <tr
                      key={s.groupId}
                      class={`cursor-pointer border-b border-slate-100 ${selected ? "bg-sky-50" : "hover:bg-slate-50"}`}
                      onClick={() => setSelectedGroupId(s.groupId)}
                    >
                      <td class="py-2 font-medium">{s.groupName}</td>
                      <td class="py-2">{s.totalStudents}</td>
                      <td class="py-2">{s.acStudents}/{s.submittedStudents}</td>
                      <td class="py-2">{Math.round(s.progressRate * 100)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section class="rounded border border-slate-200 bg-white p-3">
          <h2 class="mb-2 font-semibold">
            席順進捗マップ {selectedGroup ? `(${selectedGroup.groupName})` : ""}
          </h2>

          {maxRow === 0 || maxCol === 0
            ? <p class="text-sm text-slate-500">席データがありません。</p>
            : (
              <div class="grid gap-2" style={{ gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))` }}>
                {Array.from({ length: maxRow * maxCol }).map((_, idx) => {
                  const row = Math.floor(idx / maxCol) + 1;
                  const col = (idx % maxCol) + 1;
                  const seat = seatMap.get(`${row}:${col}`);

                  const verdict = seat?.latestVerdict ?? "NONE";
                  const tone = verdict === "AC"
                    ? "bg-emerald-100 border-emerald-300"
                    : verdict === "WA"
                    ? "bg-amber-100 border-amber-300"
                    : verdict === "NONE"
                    ? "bg-slate-100 border-slate-300"
                    : "bg-rose-100 border-rose-300";

                  return (
                    <div key={`${row}:${col}`} class={`rounded border p-2 text-xs ${tone}`}>
                      <div class="font-semibold">{row}-{col}</div>
                      {seat?.userId
                        ? (
                          <a
                            class="underline decoration-dotted"
                            href={`/submissions?userId=${encodeURIComponent(seat.userId)}`}
                            title="提出履歴へ移動"
                          >
                            {seat.studentName ?? seat.userId}
                          </a>
                        )
                        : <div>空席</div>}
                      <div>{verdict}</div>
                      <div>{seat?.submissionCount ?? 0}回</div>
                    </div>
                  );
                })}
              </div>
            )}
        </section>
      </div>

      <section class="mt-4 rounded border border-slate-200 bg-white p-3">
        <h2 class="mb-2 font-semibold">席順編集</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <form class="space-y-2" onSubmit={submitSeatUpdate}>
            <p class="text-sm font-medium">手動更新 (1席)</p>
            <div class="grid grid-cols-2 gap-2">
              <input class="rounded border border-slate-300 px-2 py-1 text-sm" value={formRow} onInput={(e) => setFormRow((e.target as HTMLInputElement).value)} placeholder="row" />
              <input class="rounded border border-slate-300 px-2 py-1 text-sm" value={formCol} onInput={(e) => setFormCol((e.target as HTMLInputElement).value)} placeholder="col" />
            </div>
            <input class="w-full rounded border border-slate-300 px-2 py-1 text-sm" value={formUserId} onInput={(e) => setFormUserId((e.target as HTMLInputElement).value)} placeholder="userId (空で空席)" />
            <input class="w-full rounded border border-slate-300 px-2 py-1 text-sm" value={formLabel} onInput={(e) => setFormLabel((e.target as HTMLInputElement).value)} placeholder="label" />
            <button class="rounded bg-slate-900 px-3 py-1 text-sm text-white" type="submit" disabled={!selectedGroupId}>席更新</button>
          </form>

          <form class="space-y-2" onSubmit={submitCsvImport}>
            <p class="text-sm font-medium">CSV取込</p>
            <textarea
              class="h-36 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
              value={csvText}
              onInput={(e) => setCsvText((e.target as HTMLTextAreaElement).value)}
            />
            <button class="rounded bg-slate-900 px-3 py-1 text-sm text-white" type="submit" disabled={!selectedGroupId}>CSV取込</button>
          </form>
        </div>
        {actionMessage && <p class="mt-2 text-sm text-slate-700">{actionMessage}</p>}
        {importErrors.length > 0 && (
          <div class="mt-3 rounded border border-amber-300 bg-amber-50 p-2">
            <p class="mb-1 text-sm font-semibold text-amber-800">CSVエラー詳細</p>
            <ul class="list-disc pl-5 text-xs text-amber-900">
              {importErrors.map((err, idx) => (
                <li key={`${err.line}:${idx}`}>line {err.line}: {err.reason}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
