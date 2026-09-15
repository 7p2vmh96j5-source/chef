import { useMemo } from "react";
import { Check, Lock, Trophy } from "lucide-react";
import { guideSections, levelInfo } from "../lib/xp.js";

export function GuideScreen({ app }) {
  const sections = useMemo(() => guideSections(app.recipes), [app.recipes]);

  const completed = useMemo(() => {
    const set = new Set();
    app.cooksOf("me").forEach((c) => { if (c.recipeId) set.add(c.recipeId); });
    return set;
  }, [app.allCooks]);

  const totalSteps = sections.reduce((sum, s) => sum + s.steps.length, 0);
  const doneCount = sections.reduce((sum, s) => sum + s.steps.filter((r) => completed.has(r.id)).length, 0);
  const level = levelInfo(app.data.xp);

  return (
    <div className="k-guide">
      <header className="k-lt"><h1>Guide</h1></header>
      <p className="k-guide-intro">Jobba dig igenom recepten steg för steg, avsnitt för avsnitt, från enkelt till avancerat. Varje steg du lagar ger XP och låser upp nästa.</p>
      <div className="k-guide-progress">
        <span className="k-level-badge"><Trophy size={13} />{level.title}</span>
        <span className="k-level-xp">{doneCount} av {totalSteps} steg klara</span>
        <span className="k-level-bar"><span style={{ width: `${totalSteps ? (doneCount / totalSteps) * 100 : 0}%` }} /></span>
      </div>

      <div className="k-chips">
        {sections.map(({ category }) => (
          <button key={category} className="k-chip" onClick={() => {
            const el = document.getElementById(`guide-${category.replace(/\s+/g, "-")}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>{category}</button>
        ))}
      </div>

      {sections.map(({ category, steps }) => {
        const sectionDone = steps.filter((r) => completed.has(r.id)).length;
        return (
          <div key={category} id={`guide-${category.replace(/\s+/g, "-")}`} className="k-guide-section">
            <h2 className="k-guide-sh">{category} <span>{sectionDone}/{steps.length}</span></h2>
            <div className="k-guide-path">
              {steps.map((r, i) => {
                const isDone = completed.has(r.id);
                const prevDone = i === 0 || completed.has(steps[i - 1].id);
                const unlocked = isDone || prevDone;
                const offset = i % 2 === 0 ? -56 : 56;
                return (
                  <button
                    key={r.id}
                    className={"k-guide-step" + (isDone ? " done" : "") + (unlocked ? "" : " locked")}
                    style={{ transform: `translateX(${offset}px)` }}
                    onClick={() => {
                      if (!unlocked) { app.showToast("Lås upp genom att laga föregående steg först"); return; }
                      app.open("recipe", r.id);
                    }}
                  >
                    <span className="k-guide-node">
                      {isDone ? <Check size={22} strokeWidth={3} /> : unlocked ? <span className="k-guide-emoji">{r.emoji}</span> : <Lock size={17} />}
                    </span>
                    <span className="k-guide-label">
                      <b>{i + 1}. {r.title}</b>
                      <span>{r.xp} XP{isDone ? " · Klar" : ""}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ height: 24 }} />
    </div>
  );
}
