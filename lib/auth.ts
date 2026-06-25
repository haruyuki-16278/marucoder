import type { State } from "../utils.ts";
import { forbidden, getCookie, getUserId, unauthorized } from "./http.ts";

export type AppRole = "teacher" | "student";

export type AuthContext = {
  userId: string;
  role: AppRole;
  isAuthenticated: boolean;
};

function parseRole(raw: string | null): AppRole | null {
  if (raw === "teacher" || raw === "student") return raw;
  return null;
}

function safeGetEnv(name: string): string | undefined {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
}

export function resolveAuth(req: Request): AuthContext {
  const headerRole = parseRole(req.headers.get("x-user-role"));
  const url = new URL(req.url);
  const queryRole = parseRole(url.searchParams.get("role"));
  const cookieRole = parseRole(getCookie(req, "mc_role"));

  const role = headerRole ?? queryRole ?? cookieRole;
  const userId = getUserId(req);
  const hasExplicitUser =
    req.headers.get("x-user-id")?.trim() ||
    url.searchParams.get("userId")?.trim() ||
    getCookie(req, "mc_user_id")?.trim();

  if (role) {
    return {
      userId,
      role,
      isAuthenticated: true,
    };
  }

  if (safeGetEnv("AUTH_STRICT") === "1") {
    return {
      userId,
      role: "student",
      isAuthenticated: false,
    };
  }

  // Non-strict mode keeps existing behavior for local development/e2e.
  return {
    userId: hasExplicitUser || userId,
    role: "teacher",
    isAuthenticated: true,
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
  if (state.auth.role !== "teacher") {
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
