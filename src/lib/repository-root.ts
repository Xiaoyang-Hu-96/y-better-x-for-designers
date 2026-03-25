import path from "path";
import { fileURLToPath } from "url";

/** Repo root (this file lives in `src/lib`). Avoid `process.cwd()` when Next infers a parent lockfile root. */
export const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
