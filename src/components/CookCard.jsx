import { Bookmark, BookmarkPlus, MessageCircle, ChefHat, Share, Images } from "lucide-react";
import { USERS } from "../data/users.js";
import { first, relDate } from "../lib/format.js";
import { modList } from "../lib/variants.js";
import { photoList } from "../lib/photos.js";
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
        <button className={"k-act" + (mine ? " on" : "")} disabled={cook.userId === "me" || mine} aria-pressed={mine} onClick={() => app.toggleMums(cook.id)}>
          mums
        </button>
        <button className="k-act" onClick={() => (detail ? onComment && onComment() : app.open("cook", cook.id, { focus: true }))}><MessageCircle size={19} />Kommentera</button>
        {!custom && <button className="k-act" onClick={() => app.open("recipe", r.id, cook.userId !== "me" ? { fromUserId: cook.userId } : undefined)}><ChefHat size={19} />Recept</button>}
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
  const ownPhotos = photoList(app.photos[cook.id]);
  const photos = ownPhotos.length ? ownPhotos : photoList(app.photos[r.id]);
  const openCook = (focus) => app.open("cook", cook.id, { focus });
  const openRecipe = () => app.open("recipe", r.id, cook.userId !== "me" ? { fromUserId: cook.userId } : undefined);

  const media = photos.length === 0
    ? <span className="k-photo" style={{ background: r.tile }}><span aria-hidden="true">{r.emoji}</span></span>
    : photos.length > 1 ? (
      <div className="k-media-wrap">
        <div className="k-media-gallery">
          {photos.map((src, i) => <img key={i} className="k-photo-img" src={src} alt={`${r.title}, bild ${i + 1} av ${photos.length}`} />)}
        </div>
        {!detail && <span className="k-photo-count"><Images size={13} />{photos.length}</span>}
      </div>
    ) : (
      <img className="k-photo-img" src={photos[0]} alt={`${r.title}, lagad av ${isMe ? "dig" : first(u.name)}`} />
    );

  return (
    <article className="k-post">
      <header className="k-post-h">
        <button className="k-plain" onClick={() => app.open("user", u.id)} aria-label={u.name}><Avatar user={u} size={40} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button className="k-plain k-name" onClick={() => app.open("user", u.id)}>{isMe ? "Du" : u.name}</button>
          <div className="k-meta">{relDate(cook.date)}</div>
        </div>
        {!detail && !custom && (
          <button className="k-feed-share" onClick={() => app.setSheet({ type: "share", recipeId: r.id })} aria-label={`Dela ${r.title}`}>
            <Share size={18} />
          </button>
        )}
        {detail && !custom && (
          <button className="k-save-recipe" onClick={() => app.data.saved.includes(r.id) ? app.toggleSave(r.id) : app.setSheet({ type: "saveTo", recipeId: r.id, fromUserId: cook.userId !== "me" ? cook.userId : undefined })} aria-label={app.data.saved.includes(r.id) ? "Ta bort recept från sparade" : "Spara recept"} aria-pressed={app.data.saved.includes(r.id)}>
            <Bookmark size={18} fill={app.data.saved.includes(r.id) ? "#000" : "none"} />
            <span>Spara recept</span>
          </button>
        )}
        {detail && custom && !cook.custom?.simple && (
          <button className={"k-save-recipe" + (savedAsRecipe ? " saved" : "")} onClick={() => app.saveCookAsRecipe(cook)} aria-label={savedAsRecipe ? "Sparat i mina recept" : "Spara i mina recept"} aria-pressed={savedAsRecipe}>
            <BookmarkPlus size={18} fill={savedAsRecipe ? "#FFB800" : "none"} />
            <span>{savedAsRecipe ? "Sparat i mina recept" : "Spara i mina recept"}</span>
          </button>
        )}
      </header>
      {detail ? (
        <>
          {custom ? (
            cook.custom?.simple ? null : (
              <div className="k-stats">
                <div><span>Typ</span><b>Egen rätt</b></div>
                <div><span>Ingredienser</span><b>{r.ingredients.length}</b></div>
              </div>
            )
          ) : <Stats />}
          <div className="k-media">{media}</div>
          <button className="k-plain k-post-title" onClick={() => (custom ? openCook(false) : openRecipe())}>{r.title}</button>
          {!custom && <RecipeCredit recipe={r} cook={cook} app={app} />}
          {cook.note && <p className="k-note">{cook.note}</p>}
          {cook.mods && <Mods mods={cook.mods} limit={null} onMore={() => openCook(false)} />}
        </>
      ) : (
        <>
          <button className="k-plain k-post-title" onClick={() => (custom ? openCook(false) : openRecipe())}>{r.title}</button>
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
