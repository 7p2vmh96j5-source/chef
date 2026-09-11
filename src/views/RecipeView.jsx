import { useState } from "react";
import { Bookmark, Share, ChefHat, Check, MoreHorizontal, X } from "lucide-react";
import { USERS } from "../data/users.js";
import { Avatar, Stats, NavBar } from "../components/ui.jsx";

export function RecipeView({ id, app }) {
  const [done, setDone] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const r = app.recipes[id];
  if (!r) return (<><NavBar onBack={app.back} title="" /><p className="k-empty" style={{ marginTop: 20 }}>Receptet finns inte längre.</p></>);

  const saved = app.data.saved.includes(id);
  const ownRecipe = r.author === "me";
  const saveCount = app.data.recipeSaves[id] || 0;
  const cookedCount = app.cookedCount(id);
  const friendCooks = app.allCooks.filter((c) => c.recipeId === id && app.data.following.includes(c.userId));
  const who = [...new Set(friendCooks.map((c) => c.userId))];
  const author = USERS[r.author];
  const toggle = (i) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));

  return (
    <>
      <NavBar onBack={app.back} title={r.title} right={
        <>
          <button className="k-nav-btn" aria-label={ownRecipe ? "Ta bort från Mina recept" : (saved ? "Ta bort från sparade" : "Spara recept")} aria-pressed={ownRecipe || saved}
            onClick={() => ownRecipe ? setConfirmDelete(true) : app.toggleSave(id)}>
            <Bookmark size={22} fill={ownRecipe ? "#FFB800" : (saved ? "#000" : "none")} color={ownRecipe ? "#FFB800" : "#000"} />
            <span className="k-save-count">{saveCount}</span>
          </button>
          <button className="k-nav-btn" aria-label="Dela recept" onClick={() => app.setSheet({ type: "share", recipeId: id })}>
            <Share size={21} />
          </button>
          {ownRecipe && (
            <button className="k-nav-btn" aria-label="Fler alternativ" onClick={() => setMenuOpen((open) => !open)}>
              <MoreHorizontal size={22} />
            </button>
          )}
        </>
      } />
      {ownRecipe && menuOpen && (
        <div className="k-recipe-menu">
          <button onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}>Ta bort recept</button>
        </div>
      )}
      {ownRecipe && confirmDelete && (
        <div className="k-confirm-backdrop" role="presentation">
          <div className="k-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-recipe-title">
            <button className="k-confirm-close" aria-label="Stäng" onClick={() => setConfirmDelete(false)}><X size={18} /></button>
            <h2 id="delete-recipe-title">Ta bort recept?</h2>
            <p>Receptet försvinner från allt i appen.</p>
            <div className="k-confirm-actions">
              <button className="k-confirm-yes" onClick={() => app.removeRecipe(id)}>Ja, ta bort</button>
              <button className="k-confirm-no" onClick={() => setConfirmDelete(false)}>Nej</button>
            </div>
          </div>
        </div>
      )}
      <div className="k-scroll">
        {app.photos[r.id]
          ? <img className="k-hero-img" src={app.photos[r.id]} alt={r.title} />
          : <div className="k-hero" style={{ background: r.tile }} aria-hidden="true">{r.emoji}</div>}
        <div className="k-rv">
          <h1>{r.title}</h1>
          {author ? (
            <button className="k-plain k-by" onClick={() => app.open("user", r.author)}>
              <Avatar user={author} size={26} />{r.author === "me" ? "Ditt recept" : `Av ${author.name}`}
            </button>
          ) : <div className="k-by">Från Köket</div>}
          <Stats cookedCount={cookedCount} />
          {who.length > 0 && (
            <div className="k-proof">
              <div className="k-av-stack">{who.slice(0, 4).map((uid) => <Avatar key={uid} user={USERS[uid]} size={26} ring="#FFF4D6" />)}</div>
              <span>{who.length} vänner har lagat detta</span>
            </div>
          )}
          <button className="k-primary" onClick={() => app.setSheet({ type: "log", recipeId: id })}><ChefHat size={20} />Jag lagade detta</button>

          <div className="k-block">
            <h2 className="k-h3">Ingredienser</h2>
            {r.ingredients.map((ing, i) => (
              <button key={i} className={"k-ing" + (done.includes(i) ? " done" : "")} onClick={() => toggle(i)} aria-pressed={done.includes(i)}>
                <span className={"k-check" + (done.includes(i) ? " on" : "")}>{done.includes(i) && <Check size={14} strokeWidth={3} />}</span>
                <span>{ing}</span>
              </button>
            ))}
          </div>

          {r.steps.length > 0 && (
            <div className="k-block">
              <h2 className="k-h3">Gör så här</h2>
              <ol className="k-steps">{r.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
