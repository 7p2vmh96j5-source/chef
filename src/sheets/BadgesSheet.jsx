import { useState } from "react";
import { X } from "lucide-react";
import { USERS } from "../data/users.js";
import { allBadgesFor } from "../lib/badges.js";
import { BadgeIcon } from "../components/ui.jsx";
import { Sheet } from "./Sheet.jsx";

export function BadgesSheet({ app, uid, onClose }) {
  const [selected, setSelected] = useState(null);
  const isMe = uid === "me";
  const xp = isMe ? app.data.xp : USERS[uid]?.xp;
  const dishCount = app.cooksOf(uid).filter((c) => !c.custom?.simple).length;
  const { levels, milestones } = allBadgesFor(xp, dishCount);

  const grid = (title, badges) => (
    <>
      <h2 className="k-sh">{title}</h2>
      <div className="k-badge-grid">
        {badges.map((b) => (
          <button key={b.id} className="k-badge-cell" onClick={() => setSelected(b)}>
            <BadgeIcon badge={b} size={52} locked={!b.earned} />
            <span>{b.title}</span>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <Sheet title={isMe ? "Mina badges" : `${USERS[uid]?.name || "Användarens"} badges`} onClose={onClose}>
      {grid("Kocknivåer", levels)}
      {grid("Milstolpar", milestones)}

      {selected && (
        <div className="k-confirm-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <div className="k-confirm" role="dialog" aria-modal="true" aria-labelledby="badge-name" onClick={(e) => e.stopPropagation()}>
            <button className="k-confirm-close" aria-label="Stäng" onClick={() => setSelected(null)}><X size={18} /></button>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <BadgeIcon badge={selected} size={64} locked={!selected.earned} />
            </div>
            <h2 id="badge-name">{selected.title}</h2>
            <p>{selected.earned ? selected.desc : "Inte upplåst än."}</p>
            <div className="k-confirm-actions">
              <button className="k-confirm-no" onClick={() => setSelected(null)}>Stäng</button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
