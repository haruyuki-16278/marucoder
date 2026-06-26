import type { State } from "../utils.ts";
import { forbidden, getCookie, unauthorized } from "./http.ts";

export type AppRole = "admin" | "teacher" | "student";

export type AuthContext = {
  userId: string;
  role: AppRole;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
};

function parseRole(raw: string | null): AppRole | null {
  if (raw === "admin" || raw === "teacher" || raw === "student") return raw;
  return null;
}

function parseBool(raw: string | null): boolean {
  return raw === "1" || raw === "true";
}

export function resolveAuth(req: Request): AuthContext {
  const cookieUserId = getCookie(req, "mc_user_id")?.trim() ?? "";
  const cookieRole = parseRole(getCookie(req, "mc_role"));
  const cookieMustChange = parseBool(getCookie(req, "mc_must_change_password"));

  if (cookieUserId && cookieRole) {
    return {
      userId: cookieUserId,
      role: cookieRole,
      isAuthenticated: true,
      mustChangePassword: cookieMustChange,
    };
  }

  return {
    userId: "",
    role: "student",
    isAuthenticated: false,
    mustChangePassword: false,
  };
}

export function getAuth(state: State): AuthContext {
  return state.auth;
}

export function requireAuth(state: State): Response | null {
  if (state.auth.isAuthenticated) return null;
  return unauthorized("UNAUTHORIZED", "authentication is required");
}

export function requireTeacher(state: State): Response | null {
  const authError = requireAuth(state);
  if (authError) return authError;
  if (state.auth.role !== "teacher" && state.auth.role !== "admin") {
    return forbidden("FORBIDDEN", "teacher role is required");
  }
  return null;
}

export function requireStudent(state: State): Response | null {
  const authError = requireAuth(state);
  if (authError) return authError;
  if (state.auth.role !== "student") {
    return forbidden("FORBIDDEN", "student role is required");
  }
  return null;
}

export function requireAdmin(state: State): Response | null {
  const authError = requireAuth(state);
  if (authError) return authError;
  if (state.auth.role !== "admin") {
    return forbidden("FORBIDDEN", "admin role is required");
  }
  return null;
}

export function requireAdminOrTeacher(state: State): Response | null {
  const authError = requireAuth(state);
  if (authError) return authError;
  if (state.auth.role !== "admin" && state.auth.role !== "teacher") {
    return forbidden("FORBIDDEN", "admin or teacher role is required");
  }
  return null;
}
