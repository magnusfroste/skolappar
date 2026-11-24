import { useCallback, useState } from "react";
import type { App } from "@/hooks/useApps";

const KEY = "skolappar-played";
const REMEMBER = 5;
const SHOW = 4;

function readPlayed(): string[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(-REMEMBER) : [];
  } catch {
    return [];
  }
}

/**
 * The apps opened in this tab, newest last. Kept only in the tab (sessionStorage, gone when it is
 * closed) and never sent anywhere: it only steers the row "Mer som det här".
 */
export function usePlayedInTab() {
  const [ids, setIds] = useState<string[]>(readPlayed);
  const add = useCallback((id: string) => {
    setIds((prev) => {
      const next = [...prev.filter((x) => x !== id), id].slice(-REMEMBER);
      try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: memory only */ }
      return next;
    });
  }, []);
  return { ids, add };
}

export const cat = (app: App, type: string) => app.categories.find((c) => c.type === type);

/**
 * Apps like the ones just played: the same subject and grade weigh most, the latest played
 * counts double, and among equals the recommended order (the order of `apps`) decides.
 */
export function pickMoreLikeThis(apps: App[], played: string[], limit = SHOW): App[] {
  const byId = new Map(apps.map((a) => [a.id, a]));
  const recent = played.map((id) => byId.get(id)).filter((a): a is App => Boolean(a));
  if (!recent.length) return [];
  const subject = new Map<string, number>();
  const age = new Map<string, number>();
  recent.forEach((a, i) => {
    const w = i === recent.length - 1 ? 2 : 1;
    const s = cat(a, "subject")?.id;
    const g = cat(a, "age")?.id;
    if (s) subject.set(s, (subject.get(s) || 0) + w);
    if (g) age.set(g, (age.get(g) || 0) + w);
  });
  const seen = new Set(played);
  return apps
    .map((a, order) => ({ a, order, score: 2 * (subject.get(cat(a, "subject")?.id || "") || 0) + (age.get(cat(a, "age")?.id || "") || 0) }))
    .filter((x) => !seen.has(x.a.id) && x.score > 0)
    .sort((x, y) => y.score - x.score || x.order - y.order)
    .slice(0, limit)
    .map((x) => x.a);
}

