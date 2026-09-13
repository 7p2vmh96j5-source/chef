import { useState, useEffect, useRef } from "react";
import { MoreHorizontal, Send, Heart, X } from "lucide-react";
import { USERS } from "../data/users.js";
import { first, relDate } from "../lib/format.js";
import { variantLines } from "../lib/variants.js";
import { Avatar, NavBar } from "../components/ui.jsx";
import { CookCard } from "../components/CookCard.jsx";

export function CookView({ id, app, focus }) {
  const [text, setText] = useState("");
  const [doneSteps, setDoneSteps] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const cook = app.allCooks.find((c) => c.id === id);
  const comments = cook ? app.commentsOf(cook) : [];
  const count = comments.length;

  useEffect(() => { if (focus && inputRef.current) inputRef.current.focus(); }, [focus]);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    prev.current = count;
  }, [count]);

  if (!cook) return (<><NavBar onBack={app.back} title="Matlagning" /><p className="k-empty" style={{ marginTop: 20 }}>Inlägget finns inte längre.</p></>);

  const recipe = app.recipeOf(cook);
  const derivedRecipe = app.data.myRecipes.find((r) => r.sourceCookId === cook.id);
  const toggleStep = (index) => setDoneSteps((done) => done.includes(index) ? done.filter((x) => x !== index) : [...done, index]);
  const send = () => {
    if (!text.trim()) return;
    app.addComment(cook.id, text.trim());
    setText("");
  };

  return (
    <>
      <NavBar onBack={app.back} title="Matlagning" right={cook.userId === "me" ? (
        <button className="k-nav-btn" onClick={() => setMenuOpen((open) => !open)} aria-label="Fler alternativ">
          <MoreHorizontal size={22} />
        </button>
      ) : null} />
      {cook.userId === "me" && menuOpen && (
        <div className="k-recipe-menu">
          <button onClick={() => { setMenuOpen(false); app.setSheet({ type: "log", editCookId: cook.id }); }}>Redigera inlägg</button>
          <button className="danger" onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}>Ta bort logg</button>
        </div>
      )}
      <div className="k-scroll grey" ref={scrollRef}>
        <CookCard cook={cook} app={app} detail onComment={() => inputRef.current && inputRef.current.focus()} />
        {!cook.custom && (
          <section className="k-panel">
            <h2 className="k-h3">Innehåll</h2>
            <ul className="k-var">
              {recipe.ingredients.map((t, i) => <li key={i}><span>{t}</span></li>)}
            </ul>
            {recipe.steps.length > 0 && (
              <>
                <h2 className="k-h3 k-content-subhead">Gör så här</h2>
                <ol className="k-steps">{recipe.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
              </>
            )}
          </section>
        )}
        {cook.custom && !cook.custom.simple && (
          <section className="k-panel">
            <h2 className="k-h3">Ingredienser</h2>
            <ul className="k-var">
              {cook.custom.ingredients.map((t, i) => <li key={i}><span>{t}</span></li>)}
            </ul>
            {recipe.steps.length > 0 && (
              <>
                <h2 className="k-h3 k-content-subhead">Gör så här</h2>
                <ul className="k-custom-steps">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className={doneSteps.includes(i) ? "done" : ""}>
                      <button className={"k-check" + (doneSteps.includes(i) ? " on" : "")} onClick={() => toggleStep(i)} aria-label={`Markera steg ${i + 1}`} aria-pressed={doneSteps.includes(i)}>
                        {doneSteps.includes(i) && "✓"}
                      </button>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
        {cook.mods && recipe && (
          <section className="k-panel">
            <h2 className="k-h3">Så här gjorde {cook.userId === "me" ? "du" : first(USERS[cook.userId].name)}</h2>
            <ul className="k-var">
              {variantLines(recipe, cook.mods).map((l, i) => (
                <li key={i} className={l.type}>
                  <span>
                    {l.type === "removed" && <span className="k-sr">Borttagen: </span>}
                    {l.text}
                    {l.from && <small>I receptet: {l.from}</small>}
                  </span>
                  {l.type === "added" && <span className="k-tag added">Ny</span>}
                  {l.type === "changed" && <span className="k-tag changed">Ändrad</span>}
                  {l.type === "removed" && <span className="k-tag" aria-hidden="true">Borttagen</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="k-panel" style={{ marginBottom: 0, minHeight: 160 }}>
          <h2 className="k-h3">Kommentarer</h2>
          {comments.length === 0 ? (
            <p className="k-meta" style={{ margin: 0, fontSize: 15 }}>Inga kommentarer än. Skriv den första.</p>
          ) : comments.map((c) => (
            <div key={c.key} className="k-cm">
              <Avatar user={USERS[c.userId]} size={32} />
              <div>
                <b>{c.userId === "me" ? "Du" : USERS[c.userId].name}</b> <span className="k-meta">{relDate(c.date)}</span>
                <p>{c.text}</p>
              </div>
              <CommentLike comment={c} app={app} />
            </div>
          ))}
        </section>
      </div>
      <div className="k-compose">
        <input ref={inputRef} className="k-field" value={text} placeholder="Skriv en kommentar"
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} aria-label="Kommentar" />
        <button className="k-send" disabled={!text.trim()} onClick={send} aria-label="Skicka kommentar"><Send size={17} /></button>
      </div>
      {cook.userId === "me" && confirmDelete && (
        <div className="k-confirm-backdrop" role="presentation">
          <div className="k-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-cook-title">
            <button className="k-confirm-close" aria-label="Stäng" onClick={() => setConfirmDelete(false)}><X size={18} /></button>
            <h2 id="delete-cook-title">Ta bort logg?</h2>
            {derivedRecipe ? (
              <>
                <p>Du har sparat ett eget recept från den här matlagningen. Vill du ta bort receptet också?</p>
                <div className="k-confirm-actions stack">
                  <button className="k-confirm-yes" onClick={() => { app.deleteCook(cook.id, { keepRecipe: false }); setConfirmDelete(false); }}>Ja, ta bort båda</button>
                  <button className="k-confirm-no" onClick={() => { app.deleteCook(cook.id, { keepRecipe: true }); setConfirmDelete(false); }}>Ja, men spara receptet</button>
                  <button className="k-confirm-no" onClick={() => setConfirmDelete(false)}>Ångra</button>
                </div>
              </>
            ) : (
              <>
                <p>Matlagningsloggen försvinner från appen.</p>
                <div className="k-confirm-actions">
                  <button className="k-confirm-yes" onClick={() => app.deleteCook(cook.id)}>Ja, ta bort</button>
                  <button className="k-confirm-no" onClick={() => setConfirmDelete(false)}>Nej</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CommentLike({ comment, app }) {
  const likes = app.data.commentLikes?.[comment.key] || [];
  const liked = likes.includes("me");
  return (
    <button className={"k-comment-like" + (liked ? " on" : "")} onClick={() => app.toggleCommentLike(comment.key)} aria-label={liked ? "Ta bort gilla-markering" : "Gilla kommentar"} aria-pressed={liked}>
      <Heart size={15} fill={liked ? "currentColor" : "none"} />
      {likes.length > 0 && <span>{likes.length}</span>}
    </button>
  );
}
