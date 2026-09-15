// XP och kocknivåer för recept från Köket

// Nivåtitlarna följer den klassiska kökshierarkin (brigade de cuisine) istället
// för påhittade namn - samma titlar som faktiskt används i riktiga kök.
// Avståndet mellan nivåerna växer snabbare ju högre upp man kommer, så att
// de sista nivåerna (Michelin-kock, Stjärnkock) tar betydligt längre att nå.
export const LEVELS = [
  { title: "Diskare", minXp: 0, desc: "Sköter disken och håller köket rent.",
    long: "Diskaren håller köket rent och ser till att kockarna alltid har rena kastruller, pannor och redskap att jobba med. Det är ofta det första steget in i restaurangbranschen och ett bra sätt att lära känna ett kök från grunden." },
  { title: "Commis Chef", minXp: 80, desc: "Nykomling som lär sig grunderna av mer erfarna kockar.",
    long: "En commis chef är nyutexaminerad eller tidigt i karriären och jobbar under en mer erfaren kock på en specifik station. Här lär man sig grundläggande tekniker, hygienrutiner och köksrutinerna på riktigt." },
  { title: "Demichef de Partie", minXp: 180, desc: "Assisterar en stationsansvarig kock.",
    long: "Demichef de partie är ett steg upp från commis och assisterar chef de partie på en station, till exempel såser eller grönsaker. Man tar mer eget ansvar men jobbar fortfarande under någon annans ledning." },
  { title: "Chef de Partie", minXp: 320, desc: "Ansvarar för en egen station, till exempel sås eller grill.",
    long: "Chef de partie, även kallad stationskock, ansvarar självständigt för en hel station i köket - till exempel grillen, såserna eller desserterna - och ser till att stationens rätter alltid håller rätt kvalitet." },
  { title: "Chef Tournant", minXp: 550, desc: "Hoppar in på vilken station som helst vid behov.",
    long: "En tournant, eller svängkock, kan hoppa in och täcka upp på vilken station som helst. Det kräver bred erfarenhet från flera olika stationer och gör personen extra värdefull när någon är borta eller det är högt tryck." },
  { title: "Sous Chef", minXp: 900, desc: "Kökets andrebefäl, näst efter köksmästaren.",
    long: "Sous chef betyder bokstavligen \"under kocken\" och är köksmästarens högra hand. Sous chefen leder det dagliga arbetet i köket, håller koll på alla stationer och hoppar in där det behövs." },
  { title: "Chef de Cuisine", minXp: 1400, desc: "Köksmästare som leder hela köket och menyn.",
    long: "Chef de cuisine, eller köksmästare, har det yttersta ansvaret för ett kök - menyn, kvaliteten, personalen och budgeten. Det är den högsta positionen i det dagliga köksarbetet på en enskild restaurang." },
  { title: "Executive Chef", minXp: 2200, desc: "Ansvarar för flera kök eller en hel restaurangkedja.",
    long: "En executive chef ansvarar för flera kök samtidigt, till exempel alla restauranger i en kedja eller ett stort hotell. Rollen handlar mer om ledarskap, menyutveckling och strategi än om att själv stå vid spisen varje dag." },
  { title: "Michelin-kock", minXp: 3400, desc: "Kock på en restaurang som tilldelats en Michelin-stjärna.",
    long: "En Michelin-kock leder ett kök som tilldelats en eller flera stjärnor i Michelinguiden - en av de mest prestigefyllda utmärkelserna en restaurang kan få. Det kräver exceptionell konsekvens, teknik och kreativitet, år efter år." },
  { title: "Stjärnkock", minXp: 5200, desc: "Världskänd kock, ofta med egna program eller restauranger.",
    long: "En stjärnkock är världskänd, ofta genom tv-program, kokböcker eller flera egna restauranger. Det är toppen av yrket - dit väldigt få når, efter årtionden av hårt arbete och oräkneliga timmar i köket." },
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

// Varje avsnitt måste klaras i ordning, steg 1 till X - det räcker inte att bara
// det närmast föregående steget är klart. Om ett senare steg råkat lagas utan att
// alla steg före det är klara (t.ex. via ett recept man hittat på annat håll),
// ska det INTE låsa upp fler steg framåt förrän kedjan verkligen kommit ikapp.
export function unlockedGuideIds(recipes, cookedRecipeIds) {
  const completed = new Set(cookedRecipeIds);
  const unlocked = new Set();
  guideSections(recipes).forEach(({ steps }) => {
    for (const step of steps) {
      unlocked.add(step.id);
      if (!completed.has(step.id)) break;
    }
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
