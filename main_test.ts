import { assertEquals } from "@std/assert";
import { json } from "./lib/http.ts";

Deno.test("http helper: json returns expected status and content-type", async () => {
  const res = json({ ok: true }, 201);

  assertEquals(res.status, 201);
  assertEquals(res.headers.get("content-type"), "application/json; charset=utf-8");
  assertEquals(await res.text(), '{"ok":true}');
});
