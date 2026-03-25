import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

/** Match subdirectory in NEXT_PUBLIC_SITE_URL (e.g. https://xiaoyanghu.com/library → /library). */
function basePathFromEnv(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  try {
    const { pathname } = new URL(raw);
    if (!pathname || pathname === "/") return undefined;
    return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  } catch {
    return undefined;
  }
}

const basePath = basePathFromEnv();

const nextConfig: NextConfig = {
  /** Stabilize tracing root when a parent folder has another lockfile (avoids wrong `process.cwd()` inference). */
  outputFileTracingRoot: configDir,
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
