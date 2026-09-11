import { Bookmark, BookmarkPlus, MessageCircle, ChefHat, Share } from "lucide-react";
import { USERS } from "../data/users.js";
import { first, relDate } from "../lib/format.js";
import { modList } from "../lib/variants.js";
import { Avatar, Stats } from "./ui.jsx";

export function Mods({ mods, items, limit, onMore, label = "Ändringar jämfört med receptet" }) {
  const all = items || modList(mods);
  if (!all.length) return null;
  const shown = limit ? all.slice(0, limit) : all;
  return (
    <div className="k-mods" aria-label={label}>
      {shown.map((m, i) => <span key={i} className={"k-mod " + m.type}>{m.label}</span>)}
      {limit && all.length > limit && (
        <button className="k-mod more" onClick={onMore}>+{all.length - limit} till</button>
      )}
    </div>
  );
}

function PinchHandIcon() {
  return (
    <svg className="k-pinch-hand" viewBox="0 0 42 42" aria-hidden="true">
      <path d="M8.5 35.5c3.8 2.1 8.1 1.9 11.7-.4l13.1-8.5c2.6-1.7 3.1-5.2 1.5-7.8l-7.9-12.3c-.8-1.3-2.6-1.7-3.9-.8-1.1.7-1.5 2.1-1.1 3.3l3.1 7.3-6.9-10.7c-.8-1.3-2.5-1.7-3.8-.9-1.2.8-1.6 2.4-.9 3.7l5.8 10.2-7.1-8.3c-1-1.1-2.6-1.2-3.7-.3-1 .9-1.1 2.5-.3 3.5l6.2 8-6.1-4.6c-1.2-.9-2.8-.6-3.6.5-.8 1.1-.6 2.6.5 3.5l5.6 4.6-3.2 5.1c-1.4 2.2-1.2 4.7.1 5.6Z" />
      <path className="k-pinch-line" d="M20.1 18.8c2.6-1.5 5.2-1.7 7.5-.9M16.8 21.1c2.5-1.2 4.8-1.2 6.8-.3" />
    </svg>
  );
}

export function CookActions({ cook, app, onComment, detail }) {
  const r = app.recipeOf(cook);
  const custom = !!cook.custom;
  const mine = !!app.data.mums[cook.id];
  const count = app.mumsOf(cook).length;
  const comments = app.commentsOf(cook);
  const socialInner = (
    <>
      {count > 0 ? (
        <button className="k-mums-count" onClick={() => app.open("mums", cook.id)}>
          {count} mums
        </button>
      ) : <span />}
      <span>{comments.length > 0 ? `${comments.length} ${comments.length === 1 ? "kommentar" : "kommentarer"}` : ""}</span>
    </>
  );

  return (
    <div className="k-actions-wrap">
      {!detail && <div className="k-social">{socialInner}</div>}
      <div className="k-actions">
        <button className={"k-act k-mums-act" + (mine ? " on" : "")} disabled={cook.userId === "me"} aria-label="Ge mums" aria-pressed={mine} onClick={() => app.toggleMums(cook.id)}>
          <PinchHandIcon />
        </button>
        <button className="k-act" onClick={() => (detail ? onComment && onComment() : app.open("cook", cook.id, { focus: true }))}><MessageCircle size={19} />Kommentera</button>
        {!custom && <button className="k-act" onClick={() => app.open("recipe", r.id)}><ChefHat size={19} />Recept</button>}
        {custom && !detail && <button className="k-act" onClick={() => app.open("cook", cook.id)}><ChefHat size={19} />Innehåll</button>}
      </div>
    </div>
  );
}

export function CookCard({ cook, app, detail, onComment }) {
  const u = USERS[cook.userId];
  const r = app.recipeOf(cook);
  if (!r || !u) return null;
  const custom = !!cook.custom;
  const isMe = cook.userId === "me";
  const comments = app.commentsOf(cook);
  const savedAsRecipe = custom && app.data.myRecipes.some((savedRecipe) => savedRecipe.sourceCookId === cook.id);
  const src = app.photos[cook.id] || app.photos[r.id];
  const openCook = (focus) => app.open("cook", cook.id, { focus });

  const media = src
    ? <img className="k-photo-img" src={src} alt={`${r.title}, lagad av ${isMe ? "dig" : first(u.name)}`} />
    : <span className="k-photo" style={{ background: r.tile }}><span aria-hidden="true">{r.emoji}</span></span>;

  return (
    <article className="k-post">
      <header className="k-post-h">
        <button className="k-plain" onClick={() => app.open("user", u.id)} aria-label={u.name}><Avatar user={u} size={40} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button className="k-plain k-name" onClick={() => app.open("user", u.id)}>{isMe ? "Du" : u.name}</button>
          <div className="k-meta">{relDate(cook.date)}, {r.category.toLowerCase()}</div>
        </div>
        {!detail && !custom && (
          <button className="k-feed-share" onClick={() => app.setSheet({ type: "share", recipeId: r.id })} aria-label={`Dela ${r.title}`}>
            <Share size={18} />
          </button>
        )}
        {detail && !custom && (
          <button className="k-save-recipe" onClick={() => app.toggleSave(r.id)} aria-label={app.data.saved.includes(r.id) ? "Ta bort recept från sparade" : "Spara recept"} aria-pressed={app.data.saved.includes(r.id)}>
            <Bookmark size={18} fill={app.data.saved.includes(r.id) ? "#000" : "none"} />
            <span>Spara recept</span>
          </button>
        )}
        {detail && custom && (
          <button className={"k-save-recipe" + (savedAsRecipe ? " saved" : "")} onClick={() => app.saveCookAsRecipe(cook)} aria-label={savedAsRecipe ? "Sparat i mina recept" : "Spara i mina recept"} aria-pressed={savedAsRecipe}>
            <BookmarkPlus size={18} fill={savedAsRecipe ? "#FFB800" : "none"} />
            <span>{savedAsRecipe ? "Sparat i mina recept" : "Spara i mina recept"}</span>
          </button>
        )}
      </header>
      {detail ? (
        <>
          {custom ? (
            <div className="k-stats">
              <div><span>Typ</span><b>Egen rätt</b></div>
              <div><span>Ingredienser</span><b>{r.ingredients.length}</b></div>
            </div>
          ) : <Stats r={r} />}
          <div className="k-media">{media}</div>
          <button className="k-plain k-post-title" onClick={() => (custom ? openCook(false) : app.open("recipe", r.id))}>{r.title}</button>
          {!custom && <RecipeCredit recipe={r} cook={cook} app={app} />}
          {cook.note && <p className="k-note">{cook.note}</p>}
          {cook.mods && <Mods mods={cook.mods} limit={null} onMore={() => openCook(false)} />}
        </>
      ) : (
        <>
          <button className="k-plain k-post-title" onClick={() => (custom ? openCook(false) : app.open("recipe", r.id))}>{r.title}</button>
          {!custom && <RecipeCredit recipe={r} cook={cook} app={app} />}
          {cook.note && <p className="k-note">{cook.note}</p>}
          {cook.mods && <Mods mods={cook.mods} limit={3} onMore={() => openCook(false)} />}
          <button className="k-plain k-media" onClick={() => openCook(false)} aria-label={`Visa inlägget om ${r.title}`}>{media}</button>
        </>
      )}
    </article>
  );
}

function RecipeCredit({ recipe, cook, app }) {
  const author = USERS[recipe.author];
  if (!author || recipe.author === cook.userId) return null;
  return (
    <button className="k-recipe-credit" onClick={() => app.open("user", recipe.author)}>
      Recept från <b>{recipe.author === "me" ? "dig" : first(author.name)}</b>
    </button>
  );
}
