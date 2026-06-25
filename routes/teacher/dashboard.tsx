import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { requireTeacher } from "../../lib/auth.ts";
import TeacherDashboard from "../../islands/TeacherDashboard.tsx";

export const handler = define.handlers({
  GET(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;
    return ctx.render(null);
  },
});

export default define.page(function TeacherDashboardPage(ctx) {
  const url = new URL(ctx.req.url);
  const problemId = url.searchParams.get("problemId") ?? "A-01";

  return (
    <>
      <Head>
        <title>教卓進捗 | marucoder</title>
      </Head>
      <TeacherDashboard initialProblemId={problemId} />
    </>
  );
});
