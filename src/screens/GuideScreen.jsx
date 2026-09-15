import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Check, Lightbulb, Lock, Trophy } from "lucide-react";
import { guideSections, levelInfo, unlockedGuideIds } from "../lib/xp.js";
import { tipFor } from "../lib/tips.js";

// Svårighetsnivåerna berättar en resa: enkel vardagsmat -> gatukökskänsla -> fine dining.
// Delas in efter position i den redan svårighetssorterade listan (tredjedelar) istället för
// fasta XP-gränser, så det fungerar oavsett hur XP-poängen råkar vara fördelade per avsnitt.
const TIERS = ["Vardagsmat", "Street food", "Fine dining"];
const tierIndexFor = (i, total) => {
  if (i < total / 3) return 0;
  if (i < (total * 2) / 3) return 1;
  return 2;
};

export function GuideScreen({ app }) {
  const sections = useMemo(() => guideSections(app.recipes), [app.recipes]);
  const rootRef = useRef(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const scroller = rootRef.current && rootRef.current.closest(".k-scroll");
    if (!scroller) return undefined;
    const onScroll = () => setShowTop(scroller.scrollTop > 300);
    scroller.addEventListener("scroll", onScroll);
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  const completed = useMemo(() => {
    const set = new Set();
    app.cooksOf("me").forEach((c) => { if (c.recipeId) set.add(c.recipeId); });
    return set;
  }, [app.allCooks]);
  const unlockedIds = useMemo(() => unlockedGuideIds(app.recipes, completed), [app.recipes, completed]);
  // Ett steg räknas bara som klart om det faktiskt lagats i rätt ordning - ett recept
  // som råkat lagas i förtid (utan att stegen före var klara) visas varken som klart
  // eller upplåst förrän kedjan kommit ikapp på riktigt.
  const isLegit = (r) => completed.has(r.id) && unlockedIds.has(r.id);

  const totalSteps = sections.reduce((sum, s) => sum + s.steps.length, 0);
  const doneCount = sections.reduce((sum, s) => sum + s.steps.filter(isLegit).length, 0);
  const level = levelInfo(app.data.xp);

  return (
    <div className="k-guide" ref={rootRef}>
      {showTop && (
        <button className="k-guide-top-btn" aria-label="Till toppen" onClick={() => {
          const scroller = rootRef.current && rootRef.current.closest(".k-scroll");
          if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
        }}>
          <ArrowUp size={19} strokeWidth={2.4} />
        </button>
      )}
      <header className="k-lt"><h1>Guide</h1></header>
      <p className="k-guide-intro">Jobba dig igenom recepten steg för steg, avsnitt för avsnitt - från enkel vardagsmat via gatukök till fine dining. Varje steg du lagar ger XP, låser upp nästa och ger ibland ett litet matlagningstips på vägen.</p>
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
        const sectionDone = steps.filter(isLegit).length;
        let lastTier = null;
        return (
          <div key={category} id={`guide-${category.replace(/\s+/g, "-")}`} className="k-guide-section">
            <h2 className="k-guide-sh">{category} <span>{sectionDone}/{steps.length}</span></h2>
            <div className="k-guide-path">
              {steps.map((r, i) => {
                const isDone = isLegit(r);
                const unlocked = unlockedIds.has(r.id);
                const offset = i % 2 === 0 ? -72 : 72;
                const tier = tierIndexFor(i, steps.length);
                const showTier = tier !== lastTier;
                const tip = showTier && lastTier !== null ? tipFor(category, tier) : null;
                lastTier = tier;
                return (
                  <Fragment key={r.id}>
                    {showTier && <h3 className="k-guide-tier">{TIERS[tier]}</h3>}
                    {tip && <div className="k-guide-tip"><Lightbulb size={14} />{tip}</div>}
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
                  </Fragment>
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
