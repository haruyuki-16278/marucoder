import { define } from "../../../../utils.ts";
import { requireAdmin } from "../../../../lib/auth.ts";
import { importTeachersCsv } from "../../../../lib/user_import.ts";
import { json } from "../../../../lib/http.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const authError = requireAdmin(ctx.state);
    if (authError) return authError;

    const contentType = ctx.req.headers.get("content-type") ?? "";
    const csv = contentType.includes("text/csv")
      ? await ctx.req.text()
      : String((await ctx.req.formData()).get("csv") ?? "");
    const report = await importTeachersCsv(csv);
    return json(report, 200);
  },
});
