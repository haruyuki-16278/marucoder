import { assertEquals } from "@std/assert";
import { evaluateAuthGate } from "./auth_gate.ts";

Deno.test("auth gate: unauthenticated page redirects to login", () => {
  const decision = evaluateAuthGate({
    auth: { userId: "", role: "student", isAuthenticated: false, mustChangePassword: false },
    pathname: "/teacher",
    isApi: false,
  });
  assertEquals(decision.allow, false);
  if (!decision.allow) {
    assertEquals(decision.redirectTo, "/login");
  }
});

Deno.test("auth gate: mustChangePassword blocks non-change page", () => {
  const decision = evaluateAuthGate({
    auth: { userId: "s001", role: "student", isAuthenticated: true, mustChangePassword: true },
    pathname: "/student",
    isApi: false,
  });
  assertEquals(decision.allow, false);
  if (!decision.allow) {
    assertEquals(decision.redirectTo, "/auth/change-password");
  }
});

Deno.test("auth gate: mustChangePassword allows change-password endpoint", () => {
  const decision = evaluateAuthGate({
    auth: { userId: "s001", role: "student", isAuthenticated: true, mustChangePassword: true },
    pathname: "/api/auth/change-password",
    isApi: true,
  });
  assertEquals(decision.allow, true);
});
