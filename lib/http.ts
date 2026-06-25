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

export function getUserId(req: Request): string {
  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId && headerUserId.trim() !== "") return headerUserId;

  const url = new URL(req.url);
  const queryUserId = url.searchParams.get("userId");
  if (queryUserId && queryUserId.trim() !== "") return queryUserId;

  return "teacher-demo";
}
