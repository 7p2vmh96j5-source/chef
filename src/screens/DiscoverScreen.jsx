import { useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { DAY_MS, CATS } from "../data/constants.js";
import { USERS } from "../data/users.js";
import { first, times } from "../lib/format.js";
import { Tile } from "../components/ui.jsx";
import { RecipeRow, UserRow, FollowButton } from "../components/rows.jsx";

export function DiscoverScreen({ app }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Alla");
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [pullStart, setPullStart] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const ql = q.trim().toLowerCase();
  const friendIds = new Set(app.data.following);

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshSeed((seed) => seed + 1);
    window.setTimeout(() => setRefreshing(false), 350);
  };
  const onTouchStart = (event) => {
    if (event.touches[0].clientY < 90) setPullStart(event.touches[0].clientY);
  };
  const onTouchEnd = (event) => {
    if (pullStart !== null && event.changedTouches[0].clientY - pullStart > 70) refresh();
    setPullStart(null);
  };
  const shuffleScore = (recipe) => {
    let score = refreshSeed + 17;
    for (let i = 0; i < recipe.id.length; i += 1) score = (score * 31 + recipe.id.charCodeAt(i)) % 100003;
    return score;
  };
  const list = Object.values(app.recipes).filter((r) =>
    r.author !== "me" &&
    (cat === "Alla" || (cat === "Vänner" ? friendIds.has(r.author) : r.category === cat)) &&
    (!ql || r.title.toLowerCase().includes(ql) ||
      r.ingredients.some((i) => i.toLowerCase().includes(ql)) ||
      (r.author && USERS[r.author] && USERS[r.author].name.toLowerCase().includes(ql)))
  ).sort((a, b) => shuffleScore(a) - shuffleScore(b));

  const since = Date.now() - 30 * DAY_MS;
  const people = Object.keys(USERS)
    .filter((id) => id !== "me" && id !== app.currentUserId && ql && USERS[id].name.toLowerCase().includes(ql))
    .sort((a, b) => USERS[a].name.localeCompare(USERS[b].name, "sv"));
  const personRows = people.map((id) => (
    <UserRow key={id} id={id} app={app} sub="" right={<FollowButton id={id} app={app} />} />
  ));
  const counts = {};
  app.allCooks.forEach((c) => {
    if (app.data.following.includes(c.userId) && new Date(c.date).getTime() > since) {
      counts[c.recipeId] = (counts[c.recipeId] || 0) + 1;
    }
  });
  const popular = Object.entries(counts)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, n]) => ({ r: app.recipes[id], n }))
    .filter((x) => x.r && x.r.author !== "me");
  const showPopular = !ql && cat === "Alla" && popular.length > 0;
  return (
    <div className="k-discover" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="k-lt"><h1>Upptäck</h1><button className={"k-refresh" + (refreshing ? " spinning" : "")} onClick={refresh} aria-label="Uppdatera recept" title="Uppdatera recept"><RefreshCw size={21} /></button></header>
      <label className="k-search">
        <Search size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recept, ingrediens eller person" aria-label="Sök recept och personer" />
      </label>
      <div className="k-chips">
        {["Alla", "Vänner", ...CATS.filter((c) => c !== "Alla")].map((c) => (
          <button key={c} className={"k-chip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <>
         {people.length > 0 && (
           <>
             <h2 className="k-sh">Personer</h2>
             <div className="k-list" style={{ "--inset": "68px" }}>{personRows}</div>
           </>
         )}
         {showPopular && (
            <>
              <h2 className="k-sh">Populärt bland dina vänner</h2>
              <div className="k-list" style={{ "--inset": "110px" }}>
                {popular.map(({ r, n }, i) => (
                  <RecipeRow key={r.id} r={r} rank={i + 1} sub={`Lagad ${times(n)} senaste månaden`} onClick={() => app.open("recipe", r.id)} />
                ))}
              </div>
            </>
          )}
          <h2 className="k-sh">{ql ? `Resultat för ”${q.trim()}”` : cat === "Alla" ? "Alla recept" : cat === "Vänner" ? "Vänners recept" : cat}</h2>
          {list.length === 0 ? (
            <p className="k-empty">
              Inga recept matchar. Prova ett annat ord eller en annan kategori.
            </p>
          ) : (
            <div className="k-grid">
              {list.map((r) => (
                <button key={r.id} className="k-gi" onClick={() => app.open("recipe", r.id)}>
                  <Tile r={r} size="100%" radius={16} font={64} />
                  <b>{r.title}</b>
                  <span>{r.category}{r.author === "me" ? ", ditt recept" : r.author ? `, ${first(USERS[r.author].name)}` : ""}</span>
                </button>
              ))}
            </div>
          )}
      </>
    </div>
  );
}
