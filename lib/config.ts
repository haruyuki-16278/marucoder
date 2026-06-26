export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AppConfig {
  port: number;
  corsOrigin: string;
  logLevel: LogLevel;
  adminPassword: string;
}

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) return fallback;
  return parsed;
}

function parseLogLevel(value: string | undefined): LogLevel {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }
  return "info";
}

export function getConfig(): AppConfig {
  const adminPassword = Deno.env.get("ADMIN_PASSWORD")?.trim();
  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD is required. Set ADMIN_PASSWORD in environment before startup.");
  }

  return {
    port: parsePort(Deno.env.get("PORT"), 8000),
    corsOrigin: Deno.env.get("CORS_ORIGIN") ?? "*",
    logLevel: parseLogLevel(Deno.env.get("LOG_LEVEL")),
    adminPassword,
  };
}

export function shouldLog(current: LogLevel, threshold: LogLevel): boolean {
  const rank: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
  };
  return rank[current] >= rank[threshold];
}
