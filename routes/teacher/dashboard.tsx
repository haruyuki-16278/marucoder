import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import TeacherDashboard from "../../islands/TeacherDashboard.tsx";

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
