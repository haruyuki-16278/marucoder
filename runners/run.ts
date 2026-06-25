export async function run(
  binaryPath: string,
  ...stdins: string[]
): Promise<void> {
  const runCommand = new Deno.Command(`./${binaryPath}`, {
    stdout: "piped",
    stderr: "piped",
    stdin: "piped",
  });

  const runProcess = runCommand.spawn();

  const writer = runProcess.stdin.getWriter();
  for (const stdin of stdins) {
    writer.write(new TextEncoder().encode(stdin));
  }
  writer.close();

  const runStdoutText = await runProcess.stdout.text();
  const runStderrText = await runProcess.stderr.text();
  const runStatus = await runProcess.status;

  if (runStatus.code === 0) {
    console.log("実行結果 (標準出力):", runStdoutText);
  } else {
    console.log("実行結果 (標準出力):", runStdoutText);
    console.log("実行結果 (標準エラー出力):", runStderrText);
  }

  console.log("実行プロセス終了コード:", runStatus.code);
}