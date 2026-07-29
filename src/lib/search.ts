import type { SearchItem } from "@/data/searchIndex";

export function searchItems(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const results: SearchItem[] = [];
  for (const item of items) {
    if (terms.every((t) => item.words.some((w) => w.startsWith(t)))) {
      results.push(item);
      if (results.length >= limit) break;
    }
  }
  return results;
}
