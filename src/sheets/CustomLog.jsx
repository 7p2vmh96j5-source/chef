import { useState } from "react";
import { Search, Plus, ChevronLeft, X } from "lucide-react";
import { CATS, EMOJIS } from "../data/constants.js";
import { INGREDIENTS, COMMON_INGREDIENTS } from "../data/recipes.js";
import { PhotoPicker } from "../components/PhotoPicker.jsx";
import { Sheet } from "./Sheet.jsx";

export function CustomLog({ app, onClose, onBack, initialTitle }) {
  const [f, setF] = useState({ title: initialTitle || "", category: "Middag", time: "30", servings: "4", emoji: "🍲" });
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [sel, setSel] = useState([]);
  const [steps, setSteps] = useState([""]);
  const [q, setQ] = useState("");
  const set = (key, value) => setF((previous) => ({ ...previous, [key]: value }));
  const ql = q.trim().toLowerCase();
  const chosen = new Set(sel.map((s) => s.name.toLowerCase()));

  const add = (name) => {
    const n = name.trim();
    if (!n || chosen.has(n.toLowerCase())) { setQ(""); return; }
    setSel((xs) => [...xs, { key: "i" + Date.now() + xs.length, name: n.charAt(0).toUpperCase() + n.slice(1), amount: "" }]);
    setQ("");
  };
  const setAmount = (key, amount) => setSel((xs) => xs.map((x) => (x.key === key ? { ...x, amount } : x)));
  const remove = (key) => setSel((xs) => xs.filter((x) => x.key !== key));
  const setStep = (index, text) => setSteps((xs) => xs.map((x, i) => (i === index ? text : x)));
  const addStep = () => setSteps((xs) => [...xs, ""]);
  const removeStep = (index) => setSteps((xs) => xs.length === 1 ? [""] : xs.filter((_, i) => i !== index));

  const results = ql
    ? INGREDIENTS.filter((i) => i.toLowerCase().includes(ql) && !chosen.has(i.toLowerCase()))
        .sort((a, b) => (b.toLowerCase().startsWith(ql) - a.toLowerCase().startsWith(ql)) || a.localeCompare(b, "sv"))
        .slice(0, 8)
    : [];
  const exact = INGREDIENTS.some((i) => i.toLowerCase() === ql) || chosen.has(ql);
  const common = COMMON_INGREDIENTS.filter((i) => !chosen.has(i.toLowerCase()));

  const canPublish = f.title.trim() && sel.length > 0;
  const publish = () => {
    const ingredients = sel.map((s) => (s.amount.trim() ? `${s.amount.trim()} ${s.name.charAt(0).toLowerCase() + s.name.slice(1)}` : s.name));
    app.logCook(null, note.trim(), photo, null, {
      title: f.title.trim(),
      category: f.category,
      time: Math.max(1, parseInt(f.time, 10) || 30),
      makes: `${Math.max(1, parseInt(f.servings, 10) || 4)} portioner`,
      emoji: f.emoji,
      ingredients,
      steps: steps.map((step) => step.trim()).filter(Boolean),
    });
  };

  return (
    <Sheet tall title="Skapa eget" onClose={onClose} bodyKey="custom"
      footer={
        <button className="k-primary" disabled={!canPublish} onClick={publish}>
          {!f.title.trim() ? "Ge rätten ett namn" : sel.length === 0 ? "Välj minst en ingrediens" : "Publicera"}
        </button>
      }>
      <button className="k-back-sm" onClick={onBack}><ChevronLeft size={22} />Välj ett recept istället</button>

      <label className="k-label" htmlFor="k-ctitle" style={{ marginTop: 4 }}>Namn</label>
      <input id="k-ctitle" className="k-input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Till exempel mormors köttbullar" />

      <label className="k-label">Ikon, visas när foto saknas</label>
      <div className="k-emojis">
        {EMOJIS.map((e) => (
          <button key={e} className={"k-emo" + (f.emoji === e ? " on" : "")} onClick={() => set("emoji", e)} aria-pressed={f.emoji === e}>{e}</button>
        ))}
      </div>

      <label className="k-label">Kategori</label>
      <div className="k-chips" style={{ padding: 0, flexWrap: "wrap" }}>
        {CATS.slice(1).map((c) => (
          <button key={c} className={"k-chip" + (f.category === c ? " on" : "")} onClick={() => set("category", c)}>{c}</button>
        ))}
      </div>

      <div className="k-two">
        <div>
          <label className="k-label" htmlFor="k-ctime">Tid (minuter)</label>
          <input id="k-ctime" className="k-input" inputMode="numeric" value={f.time} onChange={(e) => set("time", e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <label className="k-label" htmlFor="k-cserv">Antal</label>
          <input id="k-cserv" className="k-input" inputMode="numeric" value={f.servings} onChange={(e) => set("servings", e.target.value.replace(/\D/g, ""))} />
        </div>
      </div>

      <label className="k-label">Foto (valfritt)</label>
      <PhotoPicker value={photo} onChange={setPhoto} />

      <label className="k-label" htmlFor="k-cnote">Hur blev det?</label>
      <textarea id="k-cnote" className="k-input" style={{ minHeight: 76 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Berätta för dina vänner (valfritt)" />

      <div className="k-ed-head">
        <h3>Ingredienser</h3>
        <span className="k-meta">{sel.length === 0 ? "Inget valt än" : `${sel.length} valda`}</span>
      </div>

      {sel.map((s) => (
        <div key={s.key} className="k-sel">
          <span>{s.name}</span>
          <input value={s.amount} onChange={(e) => setAmount(s.key, e.target.value)} placeholder="Mängd" aria-label={`Mängd ${s.name}`} />
          <button className="k-ed-btn" onClick={() => remove(s.key)} aria-label={`Ta bort ${s.name}`}><X size={18} /></button>
        </div>
      ))}

      <label className="k-search" style={{ margin: "12px 0 4px" }}>
        <Search size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add(results[0] || q)}
          placeholder="Sök ingrediens" aria-label="Sök ingrediens" />
      </label>

      {ql ? (
        <>
          {results.map((i) => (
            <button key={i} className="k-pick" onClick={() => add(i)}>
              <span style={{ flex: 1 }}>{i}</span>
              <span className="k-add-i"><Plus size={16} strokeWidth={2.5} /></span>
            </button>
          ))}
          {!exact && (
            <button className="k-pick" onClick={() => add(q)}>
              <span style={{ flex: 1 }}>Lägg till ”{q.trim()}”</span>
              <span className="k-add-i"><Plus size={16} strokeWidth={2.5} /></span>
            </button>
          )}
        </>
      ) : common.length > 0 && (
        <>
          <p className="k-meta" style={{ margin: "10px 0 8px" }}>Vanliga ingredienser</p>
          <div className="k-chips" style={{ padding: 0, flexWrap: "wrap" }}>
            {common.map((i) => <button key={i} className="k-chip" onClick={() => add(i)}>+ {i}</button>)}
          </div>
        </>
      )}

      <div className="k-ed-head">
        <h3>Gör så här</h3>
        <span className="k-meta">Steg för steg</span>
      </div>
      {steps.map((step, i) => (
        <div key={i} className="k-custom-step">
          <span className="k-step-dot">{i + 1}</span>
          <input className="k-field" value={step} onChange={(e) => setStep(i, e.target.value)}
            placeholder={`Steg ${i + 1}`} aria-label={`Steg ${i + 1}`} />
          <button className="k-ed-btn" onClick={() => removeStep(i)} aria-label={`Ta bort steg ${i + 1}`}><X size={18} /></button>
        </div>
      ))}
      <button className="k-add-step" onClick={addStep}><Plus size={17} />Lägg till steg</button>
    </Sheet>
  );
}
