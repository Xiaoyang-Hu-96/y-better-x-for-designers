/**
 * Canonical site URL and subdirectory (basePath) from env.
 * Set on Vercel Production: NEXT_PUBLIC_SITE_URL=https://y-design-feed.vercel.app (or your custom domain)
 * so OG/metadata use the stable host, not deployment-specific VERCEL_URL.
 * Subpath example: https://example.com/library — no trailing slash. Local: omit or http://localhost:3000
 */

function pathnameFromSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "";
  try {
    const { pathname } = new URL(raw);
    if (!pathname || pathname === "/") return "";
    return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  } catch {
    return "";
  }
}

/** Next.js `basePath` e.g. `/design-resources` — empty when app is at domain root. */
export function getBasePath(): string {
  return pathnameFromSiteUrl();
}

/** Prefix root-relative public URLs for <img src> etc. External http(s) URLs unchanged. */
export function withBasePath(path: string): string {
  if (!path || /^https?:\/\//i.test(path)) return path;
  const bp = getBasePath();
  if (!bp) return path.startsWith("/") ? path : `/${path}`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${bp}${p}`;
}

/** Open Graph / metadata base (trailing slash). */
export function getMetadataBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      const origin = `${u.protocol}//${u.host}`;
      let pathname = u.pathname;
      if (pathname.endsWith("/") && pathname.length > 1) pathname = pathname.slice(0, -1);
      const prefix = pathname && pathname !== "/" ? `${pathname}/` : "";
      return new URL(prefix || "/", origin);
    } catch {
      /* fall through */
    }
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}/`);
  }
  return new URL("http://localhost:3000/");
}

/** Absolute URL for a file in public/ (metadata, sharing). */
export function absolutePublicFile(path: string): string {
  const base = getMetadataBaseUrl();
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return new URL(clean, base).href;
}
