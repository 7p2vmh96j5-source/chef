import { useState } from "react";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { USERS } from "../data/users.js";
import { first, relDate } from "../lib/format.js";
import { Avatar, Tile } from "../components/ui.jsx";

export function MessagesScreen({ app }) {
  const [selectedId, setSelectedId] = useState(null);
  const [text, setText] = useState("");
  const [recipeId, setRecipeId] = useState("");

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
          <button className="k-back" onClick={() => setSelectedId(null)}><ArrowLeft size={22} />Meddelanden</button>
          <div className="k-nav-t">{first(selected.name)}</div>
          <div className="k-nav-r"><Avatar user={selected} size={30} /></div>
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
            <span aria-hidden="true">•••</span>
            <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)} aria-label="Dela ett recept">
              <option value="" disabled hidden></option>
              {Object.values(app.recipes).map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </span>
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
      <header className="k-lt"><h1>Meddelanden</h1></header>
      {people.length === 0 ? (
        <div className="k-message-empty"><MessageCircle size={32} /><p>Följ vänner för att börja skriva med dem.</p></div>
      ) : (
        <div className="k-list k-message-list">
          {people.map((person) => {
            const chat = app.data.messages[person.id] || [];
            const latest = chat[chat.length - 1];
            return (
              <button key={person.id} className="k-row" onClick={() => setSelectedId(person.id)}>
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
