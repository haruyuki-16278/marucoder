import type { CaseResult, Verdict } from "./models.ts";

const TIME_LIMIT_MS = 5_000;

export type CompileResult =
  | { ok: true; binaryPath: string }
  | { ok: false; output: string };

export type RunResult = {
  verdict: "AC" | "WA" | "TLE" | "RE";
  exitCode: number;
  timeMs: number;
  stdout: string;
  stderr: string;
};

export async function compileC(sourceCode: string, tempDir: string): Promise<CompileResult> {
  const srcPath = `${tempDir}/main.c`;
  const binPath = `${tempDir}/main`;

  await Deno.writeTextFile(srcPath, sourceCode);

  const cmd = new Deno.Command("gcc", {
    args: ["-o", binPath, srcPath, "-lm"],
    stdout: "piped",
    stderr: "piped",
  });

  const proc = cmd.spawn();
  const [stdout, stderr, status] = await Promise.all([
    proc.stdout.text(),
    proc.stderr.text(),
    proc.status,
  ]);

  if (status.code !== 0) {
    return { ok: false, output: (stdout + stderr).slice(0, 4096) };
  }

  return { ok: true, binaryPath: binPath };
}

export async function runCase(
  binaryPath: string,
  input: string,
  expectedOutput: string,
): Promise<RunResult> {
  const absPath = await Deno.realPath(binaryPath);
  const cmd = new Deno.Command(absPath, {
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const proc = cmd.spawn();

  const writer = proc.stdin.getWriter();
  await writer.write(new TextEncoder().encode(input));
  await writer.close();

  const startMs = Date.now();
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIME_LIMIT_MS));

  const finished = Promise.all([proc.stdout.text(), proc.stderr.text(), proc.status]);

  const race = await Promise.race([finished, timeout]);

  const timeMs = Date.now() - startMs;

  if (race === null) {
    proc.kill("SIGKILL");
    await proc.status.catch(() => {});
    return { verdict: "TLE", exitCode: -1, timeMs, stdout: "", stderr: "" };
  }

  const [stdout, stderr, status] = race;

  if (status.code !== 0) {
    return { verdict: "RE", exitCode: status.code, timeMs, stdout: stdout.slice(0, 2048), stderr: stderr.slice(0, 2048) };
  }

  const normalize = (s: string) => s.replace(/\r\n/g, "\n").trimEnd();
  const verdict: "AC" | "WA" = normalize(stdout) === normalize(expectedOutput) ? "AC" : "WA";

  return { verdict, exitCode: 0, timeMs, stdout: stdout.slice(0, 2048), stderr: stderr.slice(0, 2048) };
}

export function finalVerdict(caseVerdicts: Array<"AC" | "WA" | "TLE" | "RE">): Verdict {
  const order: Record<string, number> = { TLE: 4, RE: 3, WA: 2, AC: 1 };
  let worst: "AC" | "WA" | "TLE" | "RE" = "AC";
  for (const v of caseVerdicts) {
    if ((order[v] ?? 0) > (order[worst] ?? 0)) worst = v;
  }
  return worst;
}

export async function judgeSubmission(params: {
  submissionId: string;
  problemId: string;
  sourceCode: string;
  testCases: Array<{ id: string; input: string; expectedOutput: string }>;
}): Promise<{
  verdict: Verdict;
  compileOutput: string;
  caseResults: Omit<CaseResult, "id">[];
}> {
  const tempDir = await Deno.makeTempDir({ prefix: "mc_judge_" });

  try {
    const compiled = await compileC(params.sourceCode, tempDir);
    if (!compiled.ok) {
      return {
        verdict: "CE",
        compileOutput: compiled.output,
        caseResults: [],
      };
    }

    const caseResults: Omit<CaseResult, "id">[] = [];

    for (const tc of params.testCases) {
      const run = await runCase(compiled.binaryPath, tc.input, tc.expectedOutput);
      caseResults.push({
        submissionId: params.submissionId,
        testCaseId: tc.id,
        verdict: run.verdict,
        exitCode: run.exitCode,
        timeMs: run.timeMs,
        stdout: run.stdout,
        stderr: run.stderr,
      });
    }

    const verdict = params.testCases.length === 0
      ? "AC"
      : finalVerdict(caseResults.map((r) => r.verdict));

    return { verdict, compileOutput: "", caseResults };
  } finally {
    await Deno.remove(tempDir, { recursive: true }).catch(() => {});
  }
}
