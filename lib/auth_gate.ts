import type { AuthContext } from "./auth.ts";

export type GateDecision =
  | { allow: true }
  | { allow: false; status: number; code: string; redirectTo?: string };

export function evaluateAuthGate(params: {
  auth: AuthContext;
  pathname: string;
  isApi: boolean;
}): GateDecision {
  const { auth, pathname, isApi } = params;
  const isLoginPath = pathname === "/login" || pathname === "/api/auth/session";
  const isChangePasswordPath = pathname === "/auth/change-password" || pathname === "/api/auth/change-password";
  const isLogoutPath = pathname === "/api/auth/logout";

  if (!auth.isAuthenticated && !isLoginPath) {
    if (isApi) return { allow: false, status: 401, code: "UNAUTHORIZED" };
    return { allow: false, status: 302, code: "LOGIN_REQUIRED", redirectTo: "/login" };
  }

  if (auth.isAuthenticated && auth.mustChangePassword && !isChangePasswordPath && !isLogoutPath) {
    if (isApi) return { allow: false, status: 403, code: "MUST_CHANGE_PASSWORD" };
    return { allow: false, status: 302, code: "MUST_CHANGE_PASSWORD", redirectTo: "/auth/change-password" };
  }

  return { allow: true };
}
