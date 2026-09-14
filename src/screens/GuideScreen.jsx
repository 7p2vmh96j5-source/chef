import { useMemo } from "react";
import { Check, Lock, Trophy } from "lucide-react";
import { xpForRecipe, levelInfo } from "../lib/xp.js";

function difficultyLabel(xp) {
  if (xp <= 20) return "Grunderna";
  if (xp <= 35) return "Vardagsmat";
  if (xp <= 50) return "Ta det vidare";
  if (xp <= 65) return "Avancerat";
  return "Mästarnivå";
}

export function GuideScreen({ app }) {
  const steps = useMemo(() => Object.values(app.recipes)
    .filter((r) => r.author === null)
    .map((r) => ({ ...r, xp: xpForRecipe(r) }))
    .sort((a, b) => a.xp - b.xp || a.time - b.time || a.id.localeCompare(b.id)),
  [app.recipes]);

  const completed = useMemo(() => {
    const set = new Set();
    app.cooksOf("me").forEach((c) => { if (c.recipeId) set.add(c.recipeId); });
    return set;
  }, [app.allCooks]);

  const doneCount = steps.filter((s) => completed.has(s.id)).length;
  const level = levelInfo(app.data.xp);

  let lastGroup = null;

  return (
    <div className="k-guide">
      <header className="k-lt"><h1>Guide</h1></header>
      <p className="k-guide-intro">Jobba dig igenom recepten steg för steg, från enkelt till avancerat. Varje steg du lagar ger XP och låser upp nästa.</p>
      <div className="k-guide-progress">
        <span className="k-level-badge"><Trophy size={13} />{level.title}</span>
        <span className="k-level-xp">{doneCount} av {steps.length} steg klara</span>
        <span className="k-level-bar"><span style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%` }} /></span>
      </div>
      <div className="k-guide-path">
        {steps.map((r, i) => {
          const isDone = completed.has(r.id);
          const prevDone = i === 0 || completed.has(steps[i - 1].id);
          const unlocked = isDone || prevDone;
          const group = difficultyLabel(r.xp);
          const showHeader = group !== lastGroup;
          lastGroup = group;
          const offset = i % 2 === 0 ? -56 : 56;
          return (
            <div key={r.id} className="k-guide-item">
              {showHeader && <h2 className="k-guide-sh">{group}</h2>}
              <button
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
