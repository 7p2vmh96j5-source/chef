import { useState } from "react";
import { Trophy, X } from "lucide-react";
import { LEVELS } from "../lib/xp.js";
import { Sheet } from "./Sheet.jsx";

export function ChefTitlesSheet({ onClose }) {
  const [selected, setSelected] = useState(null);

  return (
    <Sheet title="Kocktitlar" onClose={onClose} bodyKey="chef-titles">
      <p className="k-meta" style={{ margin: "0 0 12px" }}>Nivåerna du kan nå genom att laga recept från Köket, i tur och ordning. Tryck på en titel för att läsa mer.</p>
      <div className="k-list">
        {LEVELS.map((level, i) => (
          <button key={level.title} className="k-row" onClick={() => setSelected(level)}>
            <span className="k-tile" style={{ width: 44, height: 44, borderRadius: 12, background: "#F2F2F7", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Trophy size={19} color="#8E8E93" />
            </span>
            <span className="k-row-body">
              <span className="k-row-t">{i + 1}. {level.title}</span>
              <span className="k-row-s">{level.desc}</span>
            </span>
            <span className="k-meta" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>{level.minXp} XP</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="k-confirm-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <div className="k-confirm" role="dialog" aria-modal="true" aria-labelledby="chef-title-name" onClick={(e) => e.stopPropagation()}>
            <button className="k-confirm-close" aria-label="Stäng" onClick={() => setSelected(null)}><X size={18} /></button>
            <h2 id="chef-title-name">{selected.title}</h2>
            <p>{selected.long}</p>
            <div className="k-confirm-actions">
              <button className="k-confirm-no" onClick={() => setSelected(null)}>Stäng</button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
