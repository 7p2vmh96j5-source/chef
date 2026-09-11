import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { USERS } from "../data/users.js";
import { relDate, startOfWeek } from "../lib/format.js";
import { Avatar } from "../components/ui.jsx";
import { UserRow, FollowButton } from "../components/rows.jsx";

export function FriendsScreen({ app }) {
  const [q, setQ] = useState("");
  const w0 = startOfWeek(new Date());
  const board = ["me", ...app.data.following]
    .map((id) => ({ id, n: app.cooksOf(id).filter((c) => new Date(c.date) >= w0).length }))
    .sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...board.map((b) => b.n));
  const others = Object.keys(USERS).filter((id) => id !== "me" && id !== app.currentUserId);
  const ql = q.trim().toLowerCase();
  const results = ql ? others.filter((id) => USERS[id].name.toLowerCase().includes(ql)) : null;
  const suggested = others.filter((id) => !app.data.following.includes(id));

  const lastCook = (id) => {
    const cs = app.cooksOf(id);
    if (!cs.length) return "Har inte loggat något än";
    const c = cs.reduce((a, b) => (a.date > b.date ? a : b));
    const r = app.recipeOf(c);
    return `${r ? r.title : "Recept"}, ${relDate(c.date).toLowerCase()}`;
  };

  return (
    <>
      <header className="k-lt"><h1>Vänner</h1></header>
      <label className="k-search">
        <Search size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hitta vänner" aria-label="Sök personer" />
      </label>

      {results ? (
        <>
          <h2 className="k-sh">Personer</h2>
          {results.length === 0 ? <p className="k-empty">Ingen heter så. Kontrollera stavningen.</p> : (
            <div className="k-list" style={{ "--inset": "68px" }}>
              {results.map((id) => <UserRow key={id} id={id} app={app} sub={USERS[id].bio} right={<FollowButton id={id} app={app} />} />)}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="k-sh">Mest i köket den här veckan</h2>
          <div className="k-list" style={{ "--inset": "94px" }}>
            {board.map((b, i) => (
              <button key={b.id} className="k-row" onClick={() => app.open("user", b.id)}>
                <span className="k-rank">{i + 1}</span>
                <Avatar user={USERS[b.id]} size={36} />
                <span className="k-row-body">
                  <span className="k-row-t">{b.id === "me" ? "Du" : USERS[b.id].name}</span>
                  <span className="k-lb-bar"><span style={{ width: `${(b.n / max) * 100}%` }} /></span>
                </span>
                <span className="k-lb-n">{b.n}</span>
              </button>
            ))}
          </div>

          <h2 className="k-sh">Du följer</h2>
          {app.data.following.length === 0 ? <p className="k-empty">Du följer ingen än. Sök efter vänner ovan.</p> : (
            <div className="k-list" style={{ "--inset": "68px" }}>
              {app.data.following.map((id) => (
                <UserRow key={id} id={id} app={app} sub={lastCook(id)} right={<ChevronRight size={18} color="#C7C7CC" />} />
              ))}
            </div>
          )}

          {suggested.length > 0 && (
            <>
              <h2 className="k-sh">Förslag</h2>
              <div className="k-list" style={{ "--inset": "68px" }}>
                {suggested.map((id) => <UserRow key={id} id={id} app={app} sub={USERS[id].bio} right={<FollowButton id={id} app={app} />} />)}
              </div>
            </>
          )}
          <div style={{ height: 28 }} />
        </>
      )}
    </>
  );
}
