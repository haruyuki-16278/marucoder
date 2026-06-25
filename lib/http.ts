export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function badRequest(code: string, message: string, details?: string): Response {
  return json({ code, message, details }, 400);
}

export function notFound(code: string, message: string): Response {
  return json({ code, message }, 404);
}

export function unauthorized(code: string, message: string): Response {
  return json({ code, message }, 401);
}

export function forbidden(code: string, message: string): Response {
  return json({ code, message }, 403);
}

export function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;

  const pairs = header.split(";");
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.split("=");
    const key = rawKey?.trim();
    if (key !== name) continue;
    return decodeURIComponent(rest.join("=").trim());
  }

  return null;
}

export function getUserId(req: Request): string {
  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId && headerUserId.trim() !== "") return headerUserId;

  const url = new URL(req.url);
  const queryUserId = url.searchParams.get("userId");
  if (queryUserId && queryUserId.trim() !== "") return queryUserId;

  const cookieUserId = getCookie(req, "mc_user_id");
  if (cookieUserId && cookieUserId.trim() !== "") return cookieUserId;

  return "teacher-demo";
}
