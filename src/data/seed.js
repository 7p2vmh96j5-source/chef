// Genererar demodata. Ersätts av Supabase senare.

import { DAY_MS, NOTES, COMMENTS } from "./constants.js";
import { USERS } from "./users.js";
import { SEED_MODS } from "./recipes.js";

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function genCooks(uid, u) {
  const rnd = mulberry32(u.seed);
  const now = new Date();
  const others = Object.keys(USERS).filter((x) => x !== uid && x !== "me");
  const out = [];
  for (let d = 0; d < 84; d++) {
    if (rnd() < u.perWeek / 7) {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - d);
      dt.setHours(11 + Math.floor(rnd() * 9), Math.floor(rnd() * 60), 0, 0);
      if (dt > now) dt.setTime(now.getTime() - (20 + Math.floor(rnd() * 100)) * 60000);
      const recipeId = u.pool[Math.floor(Math.pow(rnd(), 1.7) * u.pool.length)];
      const note = rnd() < 0.55 ? NOTES[Math.floor(rnd() * NOTES.length)] : "";
      const mums = others.filter(() => rnd() < 0.35);
      const comments = rnd() < 0.22
        ? [{ userId: others[Math.floor(rnd() * others.length)], text: COMMENTS[Math.floor(rnd() * COMMENTS.length)] }]
        : [];
      const modPool = SEED_MODS[recipeId];
      const mods = modPool && rnd() < 0.3 ? modPool[Math.floor(rnd() * modPool.length)] : null;
      out.push({ id: `${uid}-${d}`, userId: uid, recipeId, date: dt.toISOString(), note, mums, comments, mods });
    }
  }
  return out;
}

export function defaultData() {
  const now = Date.now();
  return {
    seededAt: now,
    notifSeen: new Date(now - DAY_MS).toISOString(),
    myRecipes: [],
    myCooks: [],
    saved: [],
    recipeSaves: {},
    following: [],
    mums: {},
    comments: {},
    commentLikes: {},
    profile: { name: USERS.me.name, birthDate: "", location: "", bio: USERS.me.bio },
    messages: {},
  };
}
