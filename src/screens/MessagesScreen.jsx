import { useState, useEffect } from "react";
import { ArrowLeft, MessageCircle, Search, Send, X } from "lucide-react";
import { USERS } from "../data/users.js";
import { first, relDate } from "../lib/format.js";
import { Avatar, Tile } from "../components/ui.jsx";

export function MessagesScreen({ app }) {
  const [selectedId, setSelectedId] = useState(null);
  const [text, setText] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const selectedRecipe = recipeId ? app.recipes[recipeId] : null;

  const openChatWith = (id) => {
    setSearching(false);
    setQuery("");
    setSelectedId(id);
  };

  const ql = query.trim().toLowerCase();
  const searchResults = ql
    ? Object.keys(USERS)
        .filter((id) => id !== "me" && id !== app.currentUserId && USERS[id].name.toLowerCase().includes(ql))
        .sort((a, b) => USERS[a].name.localeCompare(USERS[b].name, "sv"))
    : [];

  // Nollställ utkastet (öppen receptmeny, valt recept, otryckt text) när man byter chatt.
  useEffect(() => {
    setPickerOpen(false);
    setRecipeId("");
    setText("");
  }, [selectedId]);

  const people = [...new Set([
    ...app.data.following,
    ...Object.keys(app.data.messages || {}),
  ])]
    .map((id) => USERS[id])
    .filter(Boolean)
    .sort((a, b) => {
      const aChat = (app.data.messages && app.data.messages[a.id]) || [];
      const bChat = (app.data.messages && app.data.messages[b.id]) || [];
      const aLatest = aChat.length ? aChat[aChat.length - 1].date : "";
      const bLatest = bChat.length ? bChat[bChat.length - 1].date : "";
      return bLatest.localeCompare(aLatest);
    });
  const selected = selectedId ? USERS[selectedId] : null;
  const messages = selectedId ? (app.data.messages[selectedId] || []) : [];

  const send = (messageText, sharedRecipeId = null) => {
    const value = messageText.trim();
    if (!selectedId || (!value && !sharedRecipeId)) return;
    app.sendMessage(selectedId, value, sharedRecipeId);
    setText("");
    setRecipeId("");
  };

  if (selected) {
    return (
      <div className="k-message-view">
        <header className="k-nav">
          <button className="k-back" onClick={() => setSelectedId(null)}><ArrowLeft size={22} />Social</button>
          <div className="k-nav-t">{first(selected.name)}</div>
          <div className="k-nav-r">
            <button className="k-plain" onClick={() => app.open("user", selectedId)} aria-label={`Visa profilen för ${selected.name}`}>
              <Avatar user={selected} size={30} />
            </button>
          </div>
        </header>
        <div className="k-messages">
          {messages.length === 0 && <p className="k-empty">Skriv något till {first(selected.name)}.</p>}
          {messages.map((m) => {
            const shared = m.recipeId ? app.recipes[m.recipeId] : null;
            return (
              <div key={m.id} className={"k-message " + (m.userId === "me" ? "mine" : "")}>
                {shared && (
                  <button className="k-message-recipe" onClick={() => app.open("recipe", shared.id)}>
                    <Tile r={shared} size={46} />
                    <span><b>{shared.title}</b><small>Delat recept</small></span>
                  </button>
                )}
                {m.text && <p>{m.text}</p>}
                <small>{relDate(m.date)}</small>
              </div>
            );
          })}
        </div>
        <div className="k-message-compose">
          <span className="k-message-more">
            <button type="button" className="k-message-more-btn" onClick={() => setPickerOpen((open) => !open)}
              aria-label="Dela ett recept" aria-expanded={pickerOpen}>
              <span aria-hidden="true">•••</span>
            </button>
            {pickerOpen && (
              <div className="k-message-recipe-menu" role="menu">
                {app.myRecipesList.length === 0 ? (
                  <p className="k-empty" style={{ padding: "10px 14px", margin: 0 }}>Inga recept att dela.</p>
                ) : app.myRecipesList.map((r) => (
                  <button key={r.id} role="menuitem" className={recipeId === r.id ? "on" : ""}
                    onClick={() => { setRecipeId(r.id); setPickerOpen(false); }}>{r.title}</button>
                ))}
              </div>
            )}
          </span>
          {selectedRecipe && (
            <span className="k-message-recipe-chip">
              <span className="k-message-recipe-chip-text">{selectedRecipe.title}</span>
              <button type="button" onClick={() => setRecipeId("")} aria-label="Ta bort valt recept"><X size={13} /></button>
            </span>
          )}
          <input autoFocus className="k-field" value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(text, recipeId || null); }}
            placeholder="Skriv ett meddelande" aria-label="Skriv ett meddelande" />
          <button className="k-send" onClick={() => send(text, recipeId || null)} disabled={!text.trim() && !recipeId} aria-label="Skicka">
            <Send size={17} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="k-lt">
        <h1>Social</h1>
        <button className="k-nav-btn" onClick={() => setSearching((s) => !s)} aria-label="Sök personer" aria-pressed={searching}>
          <Search size={22} />
        </button>
      </header>
      {searching && (
        <label className="k-search" style={{ margin: "0 16px 12px" }}>
          <Search size={18} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sök personer" aria-label="Sök personer" />
        </label>
      )}
      {searching ? (
        ql === "" ? (
          <p className="k-empty">Skriv ett namn för att söka efter personer.</p>
        ) : searchResults.length === 0 ? (
          <p className="k-empty">Inga personer matchar ”{query.trim()}”.</p>
        ) : (
          <div className="k-list">
            {searchResults.map((id) => (
              <button key={id} className="k-row" onClick={() => openChatWith(id)}>
                <Avatar user={USERS[id]} size={48} />
                <span className="k-row-body">
                  <span className="k-row-t">{USERS[id].name}</span>
                </span>
              </button>
            ))}
          </div>
        )
      ) : people.length === 0 ? (
        <div className="k-message-empty"><MessageCircle size={32} /><p>Följ vänner för att börja skriva med dem.</p></div>
      ) : (
        <div className="k-list k-message-list">
          {people.map((person) => {
            const chat = app.data.messages[person.id] || [];
            const latest = chat[chat.length - 1];
            return (
              <button key={person.id} className="k-row" onClick={() => openChatWith(person.id)}>
                <Avatar user={person} size={48} />
                <span className="k-row-body">
                  <span className="k-row-t">{person.name}</span>
                  <span className="k-row-s">{latest ? (latest.recipeId ? "Delade ett recept" : latest.text) : "Starta en chatt"}</span>
                </span>
                <span className="k-message-time">{latest ? relDate(latest.date) : "Svara"}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
