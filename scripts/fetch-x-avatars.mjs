/**
 * Downloads X profile avatars via unavatar.io and saves under public/avatars/.
 * Sets each x-blogger row's `localImg` to `/avatars/{handle}.{ext}` in both data JSON copies.
 * Run locally when not rate-limited: npm run fetch:x-avatars
 *
 * On failure for a handle, `localImg` is cleared for that row (app falls back to live Unavatar).
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "avatars");
const DELAY_MS = Number(process.env.AVATAR_FETCH_DELAY_MS ?? 2500);
const LIMIT = process.env.AVATAR_FETCH_LIMIT
  ? Number(process.env.AVATAR_FETCH_LIMIT)
  : Infinity;

const DATA_PATHS = ["src/lib/data.json", "public/data/data.json"];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extFromContentType(ct) {
  if (!ct) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  return "jpg";
}

async function fetchAvatar(handle) {
  const url = `https://unavatar.io/twitter/${encodeURIComponent(handle)}`;
  const res = await fetch(url, {
    redirect: "follow",
    headers: { Accept: "image/*", "User-Agent": "design-resource-library/1.0 (avatar cache)" },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return { ok: false, reason: `${res.status}` };
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 80) return { ok: false, reason: "too_small" };
  const ext = extFromContentType(res.headers.get("content-type"));
  return { ok: true, buf, ext };
}

function xItems(data) {
  return data.categories?.find((c) => c.id === "x-bloggers")?.items ?? [];
}

function setLocalImgByHandle(allData, handle, value) {
  for (const { data } of allData) {
    const it = xItems(data).find((i) => i.handle === handle);
    if (it) {
      if (value) it.localImg = value;
      else delete it.localImg;
    }
  }
}

async function main() {
  const loaded = DATA_PATHS.filter((rel) => existsSync(join(root, rel))).map((rel) => ({
    rel,
    data: JSON.parse(readFileSync(join(root, rel), "utf8")),
  }));

  if (!loaded.length) {
    console.error("No data.json found");
    process.exit(1);
  }

  const primary = loaded[0].data;
  const items = xItems(primary);
  mkdirSync(outDir, { recursive: true });

  let ok = 0;
  let fail = 0;
  let n = 0;

  for (const item of items) {
    if (n >= LIMIT) break;
    n++;
    const raw = item.handle?.replace(/^@/, "") ?? "";
    if (!raw) continue;

    if (item.localImg?.startsWith("/avatars/")) setLocalImgByHandle(loaded, item.handle, null);

    process.stdout.write(`${raw} … `);
    try {
      const r = await fetchAvatar(raw);
      if (!r.ok) {
        console.log("skip (" + r.reason + ")");
        setLocalImgByHandle(loaded, item.handle, null);
        fail++;
        await sleep(DELAY_MS);
        continue;
      }
      const filename = `${raw}.${r.ext}`;
      writeFileSync(join(outDir, filename), r.buf);
      const rel = `/avatars/${filename}`;
      setLocalImgByHandle(loaded, item.handle, rel);
      console.log("ok →", rel);
      ok++;
    } catch (e) {
      console.log("err", e.message);
      setLocalImgByHandle(loaded, item.handle, null);
      fail++;
    }
    await sleep(DELAY_MS);
  }

  for (const { rel, data } of loaded) {
    writeFileSync(join(root, rel), JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log("Wrote", rel);
  }

  console.log(`Done. Saved ${ok}, failed ${fail}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
