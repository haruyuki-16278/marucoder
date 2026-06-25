import { define } from "../../utils.ts";
import { requireTeacher } from "../../lib/auth.ts";

export default define.middleware((ctx) => {
  const authError = requireTeacher(ctx.state);
  if (authError) return authError;
  return ctx.next();
});
