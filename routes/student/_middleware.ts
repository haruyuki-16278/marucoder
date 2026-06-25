import { define } from "../../utils.ts";
import { requireStudent } from "../../lib/auth.ts";

export default define.middleware((ctx) => {
  const authError = requireStudent(ctx.state);
  if (authError) return authError;
  return ctx.next();
});
