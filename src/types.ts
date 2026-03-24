export interface ResourceItem {
  name: string;
  url: string;
  note: string | null;
  tier: 1 | 2;
  handle?: string | null;
  bio?: string | null;
  /**
   * Link cards: preview image (absolute URL or `/…` under public).
   * X account rows: profile avatar — same shape; falls back to Unavatar if missing or broken.
   */
  localImg?: string | null;
}

export interface Category {
  id: string;
  label: string;
  description?: string;
  items: ResourceItem[];
}

export interface DataMeta {
  title: string;
  author: string;
  site: string;
  description: string;
}

export interface DataJson {
  meta: DataMeta;
  categories: Category[];
}

export function isXAccount(item: ResourceItem): boolean {
  return Boolean(item.handle && item.bio);
}

export function getDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
