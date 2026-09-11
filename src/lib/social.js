// Mums, kommentarer, notiser och gemensamma vänner

import { DAY_MS } from "../data/constants.js";
import { USERS, SHARED, FOLLOWERS } from "../data/users.js";
import { first } from "./format.js";

export function topRecipes(cooks) {
  const m = {};
  cooks.forEach((c) => { if (c.recipeId) m[c.recipeId] = (m[c.recipeId] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3);
}

// Stabil tidpunkt för seedade händelser (mums/kommentarer) på en matlagning
export function evDate(cook, mins) {
  const base = new Date(cook.date).getTime();
  const t = base + mins * 60000;
  return new Date(t > Date.now() ? base : t).toISOString();
}

export function mutualText(ids) {
  const n = ids.map((id) => first(USERS[id].name));
  if (n.length === 1) return `Gemensam vän: ${n[0]}`;
  if (n.length === 2) return `Gemensamma vänner: ${n[0]} och ${n[1]}`;
  return `Gemensamma vänner: ${n[0]}, ${n[1]} och ${n.length - 2} till`;
}

export function mumsText(ids) {
  const names = ids.map((id) => (id === "me" ? "Du" : first(USERS[id].name)));
  if (names.length === 1) return `${names[0]} tyckte mums`;
  if (names.length === 2) return `${names[0]} och ${names[1]} tyckte mums`;
  return `${names[0]}, ${names[1]} och ${names.length - 2} till tyckte mums`;
}

export function buildNotifs(myCooks, data) {
  const out = [];
  const myRecipeIds = new Set((data.myRecipes || []).map((r) => r.id));
  myCooks.forEach((c) => {
    c.mums.forEach((uid, i) => out.push({
      key: `m-${c.id}-${uid}`, type: "mums", userId: uid, cookId: c.id, recipeId: c.recipeId,
      date: (c.mumsAt && c.mumsAt[uid]) || evDate(c, 23 * (i + 1)),
    }));
    c.comments.forEach((cm, i) => out.push({
      key: `c-${c.id}-${i}`, type: "comment", userId: cm.userId, cookId: c.id, recipeId: c.recipeId,
      text: cm.text, date: cm.date || evDate(c, 40 * (i + 1)),
    }));
    (data.sharedMums?.[c.id] || []).forEach((m) => out.push({
      key: `sm-${c.id}-${m.userId}`, type: "mums", userId: m.userId, cookId: c.id, recipeId: c.recipeId, date: m.date,
    }));
    (data.sharedComments?.[c.id] || []).forEach((cm) => out.push({
      key: `sc-${c.id}-${cm.id}`, type: "comment", userId: cm.userId, cookId: c.id, recipeId: c.recipeId,
      text: cm.text, date: cm.date,
    }));
  });
  myRecipeIds.forEach((rid) => {
    (data.sharedSaves?.[rid] || []).forEach((s) => out.push({
      key: `sv-${rid}-${s.userId}`, type: "save", userId: s.userId, recipeId: rid, date: s.date,
    }));
  });
  (data.sharedCooks || []).forEach((c) => {
    if (c.recipeId && myRecipeIds.has(c.recipeId)) out.push({
      key: `ck-${c.id}`, type: "cooked", userId: c.userId, cookId: c.id, recipeId: c.recipeId, date: c.date,
    });
  });
  SHARED.forEach((s) => out.push({
    key: `s-${s.recipeId}`, type: "share", userId: s.from, recipeId: s.recipeId,
    date: new Date(data.seededAt - s.hoursAgo * 3600000).toISOString(),
  }));
  FOLLOWERS.forEach((f) => out.push({
    key: `f-${f.from}`, type: "follow", userId: f.from,
    date: new Date(data.seededAt - f.hoursAgo * 3600000).toISOString(),
  }));
  const since = new Date(Date.now() - 30 * DAY_MS).toISOString();
  return out.filter((n) => n.date > since).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
}
