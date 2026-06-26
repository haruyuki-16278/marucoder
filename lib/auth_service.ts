import type { AppRole } from "./auth.ts";
import { getConfig } from "./config.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import { getUser, updateUserPassword } from "./user_repo.ts";

export type AuthenticatedUser = {
  userId: string;
  role: AppRole;
  mustChangePassword: boolean;
};

export async function authenticate(username: string, password: string): Promise<AuthenticatedUser | null> {
  const userId = username.trim();
  if (!userId || !password) return null;

  if (userId === "admin") {
    const config = getConfig();
    // 固定比較は長さ差で早期終了しないように verifyPassword と同じ系統の比較を使う。
    const ok = await subtleCompare(password, config.adminPassword);
    if (!ok) return null;
    return {
      userId: "admin",
      role: "admin",
      mustChangePassword: false,
    };
  }

  const user = await getUser(userId);
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  return {
    userId: user.username,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  const user = await getUser(userId);
  if (!user) return false;
  if (user.role === "admin") return false;

  const passwordHash = await hashPassword(newPassword);
  return await updateUserPassword(userId, passwordHash, false);
}

async function subtleCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const aDigest = new Uint8Array(await crypto.subtle.digest("SHA-256", aBytes));
  const bDigest = new Uint8Array(await crypto.subtle.digest("SHA-256", bBytes));
  if (aDigest.length !== bDigest.length) return false;
  let diff = 0;
  for (let i = 0; i < aDigest.length; i++) diff |= aDigest[i] ^ bDigest[i];
  return diff === 0;
}
