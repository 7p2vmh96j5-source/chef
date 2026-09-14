import { Trophy } from "lucide-react";
import { LEVELS } from "../lib/xp.js";
import { Sheet } from "./Sheet.jsx";

export function ChefTitlesSheet({ onClose }) {
  return (
    <Sheet title="Kocktitlar" onClose={onClose} bodyKey="chef-titles">
      <p className="k-meta" style={{ margin: "0 0 12px" }}>Nivåerna du kan nå genom att laga recept från Köket, i tur och ordning.</p>
      <div className="k-list">
        {LEVELS.map((level, i) => (
          <div key={level.title} className="k-row" style={{ cursor: "default" }}>
            <span className="k-tile" style={{ width: 44, height: 44, borderRadius: 12, background: "#F2F2F7", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Trophy size={19} color="#8E8E93" />
            </span>
            <span className="k-row-body">
              <span className="k-row-t">{i + 1}. {level.title}</span>
              <span className="k-row-s">{level.desc}</span>
            </span>
            <span className="k-meta" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>{level.minXp} XP</span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
