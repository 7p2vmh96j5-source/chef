// Ändringar jämfört med ett recept när man loggar en matlagning

import { lcFirst } from "./format.js";

export const normMods = (m) => ({ removed: [], added: [], changed: [], ...(m || {}) });

export function modList(mods) {
  const m = normMods(mods);
  return [
    ...m.changed.map((c) => ({ type: "changed", label: `${c.from} → ${lcFirst(c.to)}` })),
    ...m.added.map((t) => ({ type: "added", label: `+ ${lcFirst(t)}` })),
    ...m.removed.map((t) => ({ type: "removed", label: `Utan ${lcFirst(t)}` })),
  ];
}

// Hela ingredienslistan för en variant, med markering per rad
export function variantLines(recipe, mods) {
  const m = normMods(mods);
  const lines = recipe.ingredients.map((t) => {
    if (m.removed.includes(t)) return { type: "removed", text: t };
    const ch = m.changed.find((c) => c.from === t);
    if (ch) return { type: "changed", text: ch.to, from: t };
    return { type: "same", text: t };
  });
  return [...lines, ...m.added.map((t) => ({ type: "added", text: t }))];
}

export const toItems = (r) => (r ? r.ingredients.map((t, i) => ({ key: "o" + i, orig: t, text: t, removed: false })) : []);

// Bygger upp redigeringsraderna igen från ett recept plus tidigare sparade ändringar
export function itemsFromMods(r, mods) {
  if (!r) return [];
  const m = normMods(mods);
  const items = r.ingredients.map((t, i) => {
    if (m.removed.includes(t)) return { key: "o" + i, orig: t, text: t, removed: true };
    const ch = m.changed.find((c) => c.from === t);
    return { key: "o" + i, orig: t, text: ch ? ch.to : t, removed: false };
  });
  const added = m.added.map((t, i) => ({ key: "e" + i, orig: null, text: t, removed: false }));
  return [...items, ...added];
}

export function itemsToMods(items) {
  const removed = [], added = [], changed = [];
  items.forEach((it) => {
    const t = it.text.trim();
    if (it.orig == null) { if (t) added.push(t); return; }
    if (it.removed || !t) removed.push(it.orig);
    else if (t !== it.orig) changed.push({ from: it.orig, to: t });
  });
  return removed.length || added.length || changed.length ? { removed, added, changed } : null;
}
