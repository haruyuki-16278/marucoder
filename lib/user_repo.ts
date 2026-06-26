import { getKV } from "./kv.ts";
import type { Role, UserAccount } from "./models.ts";

function nowIso(): string {
  return new Date().toISOString();
}

export async function getUser(username: string): Promise<UserAccount | null> {
  const kv = await getKV();
  const res = await kv.get<UserAccount>(["users", username]);
  return res.value;
}

export async function listUsersByRole(role: Role): Promise<UserAccount[]> {
  const kv = await getKV();
  const users: UserAccount[] = [];
  for await (const entry of kv.list<UserAccount>({ prefix: ["users"] })) {
    if (entry.value.role !== role) continue;
    users.push(entry.value);
  }
  return users.sort((a, b) => a.username.localeCompare(b.username));
}

export async function createUser(input: {
  username: string;
  role: Role;
  email?: string;
  passwordHash: string;
  mustChangePassword: boolean;
}): Promise<{ ok: true; user: UserAccount } | { ok: false; reason: string }> {
  const kv = await getKV();
  const existing = await kv.get<UserAccount>(["users", input.username]);
  if (existing.value) return { ok: false, reason: "username already exists" };

  const user: UserAccount = {
    username: input.username,
    role: input.role,
    email: input.email?.trim() || null,
    passwordHash: input.passwordHash,
    mustChangePassword: input.mustChangePassword,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  await kv.set(["users", input.username], user);
  return { ok: true, user };
}

export async function updateUserPassword(username: string, passwordHash: string, mustChangePassword: boolean): Promise<boolean> {
  const kv = await getKV();
  const existing = await kv.get<UserAccount>(["users", username]);
  if (!existing.value) return false;

  const updated: UserAccount = {
    ...existing.value,
    passwordHash,
    mustChangePassword,
    updatedAt: nowIso(),
  };
  await kv.set(["users", username], updated);
  return true;
}
