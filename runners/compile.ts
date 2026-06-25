export async function compile(filePath: string): Promise<string> {
  const binaryPath = filePath.replace(/\.c$/, "");

  const command = new Deno.Command("gcc", {
    args: ["-o", binaryPath, filePath],
    stdout: "piped",
    stderr: "piped",
  })

  const process = command.spawn()

  const stdoutText = await process.stdout.text();
  const stderrText = await process.stderr.text(); 

  const status = await process.status;
  if (status.code === 0) {
    console.log("コンパイル成功");
    console.log("コンパイラ出力:", stdoutText.length > 0 ? stdoutText : "(no output)");
  } else {
    console.error("コンパイル失敗:", status.code);
    console.error("コンパイラエラー出力:", stderrText.length > 0 ? stderrText : "(no output)");

    Deno.exit(status.code);
  }
  console.log("");

  return binaryPath;
}