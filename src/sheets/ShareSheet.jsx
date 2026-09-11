import { useState } from "react";
import { Check } from "lucide-react";
import { USERS } from "../data/users.js";
import { first } from "../lib/format.js";
import { Avatar, Tile } from "../components/ui.jsx";
import { Sheet } from "./Sheet.jsx";

export function ShareSheet({ app, recipeId, onClose }) {
  const [sel, setSel] = useState([]);
  const r = app.recipes[recipeId];
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const label = sel.length === 0 ? "Välj vänner" : `Skicka till ${sel.length === 1 ? first(USERS[sel[0]].name) : `${sel.length} vänner`}`;

  return (
    <Sheet title="Dela recept" onClose={onClose}
      footer={<button className="k-primary" disabled={!sel.length} onClick={() => app.share(recipeId, sel)}>{label}</button>}>
      <div className="k-row" style={{ padding: "4px 0 12px" }}>
        <Tile r={r} size={48} />
        <span className="k-row-body">
          <span className="k-row-t">{r.title}</span>
          {r.author && <span className="k-row-s">{r.author === "me" ? "Ditt recept" : `Av ${USERS[r.author].name}`}</span>}
        </span>
      </div>
      {app.data.following.length === 0 && <p className="k-empty" style={{ padding: 0 }}>Följ någon under Vänner för att kunna dela recept.</p>}
      {app.data.following.map((id) => (
        <button key={id} className="k-pick" onClick={() => toggle(id)} aria-pressed={sel.includes(id)}>
          <Avatar user={USERS[id]} size={36} />
          <span style={{ flex: 1 }}>{USERS[id].name}</span>
          <span className={"k-check" + (sel.includes(id) ? " on" : "")}>{sel.includes(id) && <Check size={14} strokeWidth={3} />}</span>
        </button>
      ))}
    </Sheet>
  );
}
