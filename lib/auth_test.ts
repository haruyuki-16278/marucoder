import { assertEquals } from "@std/assert";
import { resolveAuth, requireAdmin, requireAdminOrTeacher, requireStudent, requireTeacher } from "./auth.ts";

Deno.test("auth: resolve from cookies", () => {
  const req = new Request("http://localhost:8000/", {
    headers: {
      cookie: "mc_user_id=s001; mc_role=student; mc_must_change_password=1",
    },
  });

  const auth = resolveAuth(req);
  assertEquals(auth.userId, "s001");
  assertEquals(auth.role, "student");
  assertEquals(auth.isAuthenticated, true);
  assertEquals(auth.mustChangePassword, true);
});

Deno.test("auth: no cookie means unauthenticated", () => {
  const req = new Request("http://localhost:8000/");
  const auth = resolveAuth(req);
  assertEquals(auth.isAuthenticated, false);
});

Deno.test("auth: unauthenticated when no session", () => {
  const req = new Request("http://localhost:8000/");
  const auth = resolveAuth(req);
  assertEquals(auth.isAuthenticated, false);
  assertEquals(auth.mustChangePassword, false);
});

Deno.test("authz: role guards", () => {
  const adminState = { auth: { userId: "admin", role: "admin", isAuthenticated: true, mustChangePassword: false } } as any;
  const teacherState = { auth: { userId: "t", role: "teacher", isAuthenticated: true, mustChangePassword: false } } as any;
  const studentState = { auth: { userId: "s", role: "student", isAuthenticated: true, mustChangePassword: false } } as any;

  assertEquals(requireAdmin(adminState), null);
  assertEquals(requireAdmin(teacherState)?.status, 403);

  assertEquals(requireTeacher(adminState), null);
  assertEquals(requireTeacher(teacherState), null);
  assertEquals(requireTeacher(studentState)?.status, 403);

  assertEquals(requireStudent(studentState), null);
  assertEquals(requireStudent(teacherState)?.status, 403);

  assertEquals(requireAdminOrTeacher(adminState), null);
  assertEquals(requireAdminOrTeacher(teacherState), null);
  assertEquals(requireAdminOrTeacher(studentState)?.status, 403);
});
