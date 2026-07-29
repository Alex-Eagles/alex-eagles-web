import type MiniSearchType from "minisearch";

export interface SearchDoc {
  id: string;
  text: string;
  route: string;
  page: string;
  params?: string;
  anchor?: string;
}

export interface SearchHit extends SearchDoc {
  terms: string[];
}

let enginePromise: Promise<MiniSearchType<SearchDoc>> | null = null;

/** Loads minisearch + the generated index on first use, then reuses it. */
export function loadEngine(): Promise<MiniSearchType<SearchDoc>> {
  if (!enginePromise) {
    enginePromise = Promise.all([
      import("minisearch"),
      import("@/data/search-index.json"),
    ]).then(([{ default: MiniSearch }, docs]) => {
      const engine = new MiniSearch<SearchDoc>({
        fields: ["text", "page"],
        storeFields: ["text", "route", "page", "params", "anchor"],
        searchOptions: { boost: { text: 3 }, combineWith: "AND" },
      });
      engine.addAll((docs.default ?? docs) as unknown as SearchDoc[]);
      return engine;
    });
  }
  return enginePromise;
}

export async function runSearch(query: string, limit = 10): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const engine = await loadEngine();
  // Exact/prefix first; only spend fuzzy matching when that comes up short, so
  // clean queries never get polluted by near-misses.
  let raw = engine.search(trimmed, { prefix: true, fuzzy: false });
  if (raw.length < limit) {
    const seen = new Set(raw.map((r) => r.id));
    const fuzzy = (term: string) => (term.length < 4 ? 0 : 2);
    for (const hit of engine.search(trimmed, { prefix: true, fuzzy, maxFuzzy: 2 })) {
      if (!seen.has(hit.id)) {
        seen.add(hit.id);
        raw.push(hit);
      }
    }
  }

  // One wrong word shouldn't empty the list — "student unmanned aerial
  // vehicle" still finds the SUAS card, which says "systems".
  if (!raw.length) {
    const fuzzy = (term: string) => (term.length < 4 ? 0 : 2);
    raw = engine.search(trimmed, { prefix: true, fuzzy, maxFuzzy: 2, combineWith: "OR" });
  }

  const results: SearchHit[] = [];
  const seenText = new Set<string>();
  for (const hit of raw) {
    const key = hit.route + "|" + (hit.params ?? "") + "|" + (hit.anchor ?? "") + "|" + hit.text;
    if (seenText.has(key)) continue;
    seenText.add(key);
    results.push({
      id: hit.id,
      text: hit.text,
      route: hit.route,
      page: hit.page,
      params: hit.params,
      anchor: hit.anchor,
      terms: hit.terms ?? [],
    });
    if (results.length >= limit) break;
  }
  return results;
}
