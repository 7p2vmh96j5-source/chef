// XP och kocknivåer för recept från Köket

export const LEVELS = [
  { title: "Nybörjarkock", minXp: 0 },
  { title: "Hobbykock", minXp: 60 },
  { title: "Street kock", minXp: 130 },
  { title: "Hemmakock", minXp: 220 },
  { title: "Skicklig kock", minXp: 350 },
  { title: "Mästerkock", minXp: 550 },
  { title: "Signaturkock", minXp: 800 },
  { title: "Stjärnkock", minXp: 1150 },
  { title: "Michelin-kock", minXp: 1600 },
  { title: "Legendarisk kock", minXp: 2200 },
];

// Enkel, transparent svårighetsberäkning utifrån tid, antal steg och antal
// ingredienser - inget manuellt taggat per recept, så alla Köket-recept
// (nya som gamla) får ett rimligt XP-värde automatiskt.
export function xpForRecipe(recipe) {
  if (!recipe) return 0;
  const time = recipe.time || 30;
  const steps = recipe.steps ? recipe.steps.length : 0;
  const ingredients = recipe.ingredients ? recipe.ingredients.length : 0;
  const score = time + steps * 8 + ingredients * 4;
  return Math.max(10, Math.min(80, Math.round(score / 6)));
}

// Ordningen på avsnitten (världarna) i guiden.
export const GUIDE_CATEGORIES = ["Frukost", "Lunch", "Mellanmål", "Middag", "Late snacks", "Bakverk", "Tårtor", "Kakor"];

// Grupperar Kökets recept per avsnitt, sorterade från lättast till svårast inom varje avsnitt.
export function guideSections(recipes) {
  const byCat = {};
  Object.values(recipes).filter((r) => r.author === null).forEach((r) => {
    const cat = GUIDE_CATEGORIES.includes(r.category) ? r.category : "Middag";
    (byCat[cat] = byCat[cat] || []).push({ ...r, xp: xpForRecipe(r) });
  });
  return GUIDE_CATEGORIES.filter((cat) => byCat[cat]).map((cat) => ({
    category: cat,
    steps: byCat[cat].sort((a, b) => a.xp - b.xp || a.time - b.time || a.id.localeCompare(b.id)),
  }));
}

// Platt lista av alla steg, avsnitt för avsnitt - används där bara ordningen spelar roll.
export function guideSteps(recipes) {
  return guideSections(recipes).flatMap((section) => section.steps);
}

// Varje avsnitt låses upp för sig: ett recept är upplåst om det redan är lagat
// eller om steget innan det (inom samma avsnitt) är det.
export function unlockedGuideIds(recipes, cookedRecipeIds) {
  const completed = new Set(cookedRecipeIds);
  const unlocked = new Set();
  guideSections(recipes).forEach(({ steps }) => {
    steps.forEach((r, i) => {
      const prevDone = i === 0 || completed.has(steps[i - 1].id);
      if (completed.has(r.id) || prevDone) unlocked.add(r.id);
    });
  });
  return unlocked;
}

export function levelInfo(xp) {
  const value = xp || 0;
  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (value >= LEVELS[i].minXp) index = i;
  }
  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  const progress = next ? (value - current.minXp) / (next.minXp - current.minXp) : 1;
  return {
    title: current.title,
    level: index + 1,
    xp: value,
    next,
    progress: Math.max(0, Math.min(1, progress)),
    xpToNext: next ? next.minXp - value : 0,
  };
}
