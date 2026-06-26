import { define } from "../../utils.ts";
import { requireAdmin } from "../../lib/auth.ts";

export default define.middleware((ctx) => {
  const authError = requireAdmin(ctx.state);
  if (authError) return authError;
  return ctx.next();
});
