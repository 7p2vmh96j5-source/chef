import { useState } from "react";
import { EMOJIS } from "../data/constants.js";
import { INGREDIENTS, COMMON_INGREDIENTS } from "../data/recipes.js";
import { PhotoPicker } from "../components/PhotoPicker.jsx";
import { Sheet } from "./Sheet.jsx";
import { Search, Plus, X } from "lucide-react";

export function NewRecipeSheet({ app, onClose }) {
  const [f, setF] = useState({ title: "", emoji: "🍲" });
  const [err, setErr] = useState("");
  const [photos, setPhotos] = useState([]);
  const [sel, setSel] = useState([]);
  const [q, setQ] = useState("");
  const [steps, setSteps] = useState([""]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const chosen = new Set(sel.map((item) => item.name.toLowerCase()));
  const ql = q.trim().toLowerCase();
  const results = ql
    ? INGREDIENTS.filter((item) => item.toLowerCase().includes(ql) && !chosen.has(item.toLowerCase()))
      .sort((a, b) => (b.toLowerCase().startsWith(ql) - a.toLowerCase().startsWith(ql)) || a.localeCompare(b, "sv"))
      .slice(0, 8)
    : [];
  const common = COMMON_INGREDIENTS.filter((item) => !chosen.has(item.toLowerCase()));
  const addIngredient = (name) => {
    const value = name.trim();
    if (!value || chosen.has(value.toLowerCase())) { setQ(""); return; }
    setSel((items) => [...items, { key: "i" + Date.now() + items.length, name: value.charAt(0).toUpperCase() + value.slice(1), amount: "" }]);
    setQ("");
  };
  const setAmount = (key, amount) => setSel((items) => items.map((item) => item.key === key ? { ...item, amount } : item));
  const removeIngredient = (key) => setSel((items) => items.filter((item) => item.key !== key));
  const setStep = (index, value) => setSteps((items) => items.map((item, i) => i === index ? value : item));
  const addStep = () => setSteps((items) => [...items, ""]);
  const removeStep = (index) => setSteps((items) => items.length === 1 ? [""] : items.filter((_, i) => i !== index));

  const save = () => {
    const ingredients = sel.map((item) => item.amount.trim()
      ? `${item.amount.trim()} ${item.name.charAt(0).toLowerCase() + item.name.slice(1)}`
      : item.name);
    if (!f.title.trim()) return setErr("Ge receptet ett namn.");
    if (!ingredients.length) return setErr("Lägg till minst en ingrediens.");
    app.addRecipe({
      title: f.title.trim(),
      category: "Middag",
      time: 30,
      makes: "4 portioner",
      emoji: f.emoji,
      ingredients,
      steps: steps.map((step) => step.trim()).filter(Boolean),
    }, photos);
  };

  return (
    <Sheet tall title="Nytt recept" onClose={onClose} footer={<button className="k-primary" onClick={save}>Spara recept</button>}>
      <label className="k-label" htmlFor="k-t">Namn</label>
      <input id="k-t" className="k-input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Till exempel mormors köttbullar" />

      <label className="k-label">Ikon, visas när foto saknas</label>
      <div className="k-emojis">
        {EMOJIS.map((e) => (
          <button key={e} className={"k-emo" + (f.emoji === e ? " on" : "")} onClick={() => set("emoji", e)} aria-pressed={f.emoji === e}>{e}</button>
        ))}
      </div>

      <label className="k-label">Foto (valfritt)</label>
      <PhotoPicker multiple value={photos} onChange={setPhotos} />

      <div className="k-ed-head">
        <h3>Ingredienser</h3>
        <span className="k-meta">{sel.length === 0 ? "Inget valt än" : `${sel.length} valda`}</span>
      </div>
      {sel.map((item) => (
        <div key={item.key} className="k-sel">
          <span>{item.name}</span>
          <input value={item.amount} onChange={(e) => setAmount(item.key, e.target.value)} placeholder="Mängd" aria-label={`Mängd ${item.name}`} />
          <button className="k-ed-btn" onClick={() => removeIngredient(item.key)} aria-label={`Ta bort ${item.name}`}><X size={18} /></button>
        </div>
      ))}
      <label className="k-search" style={{ margin: "12px 0 4px" }}>
        <Search size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addIngredient(results[0] || q)}
          placeholder="Sök ingrediens" aria-label="Sök ingrediens" />
      </label>
      {ql ? (
        <>
          {results.map((item) => (
            <button key={item} className="k-pick" onClick={() => addIngredient(item)}>
              <span style={{ flex: 1 }}>{item}</span><span className="k-add-i"><Plus size={16} strokeWidth={2.5} /></span>
            </button>
          ))}
          {!INGREDIENTS.some((item) => item.toLowerCase() === ql) && (
            <button className="k-pick" onClick={() => addIngredient(q)}>
              <span style={{ flex: 1 }}>Lägg till ”{q.trim()}”</span><span className="k-add-i"><Plus size={16} strokeWidth={2.5} /></span>
            </button>
          )}
        </>
      ) : common.length > 0 && (
        <>
          <p className="k-meta" style={{ margin: "10px 0 8px" }}>Vanliga ingredienser</p>
          <div className="k-chips" style={{ padding: 0, flexWrap: "wrap" }}>
            {common.map((item) => <button key={item} className="k-chip" onClick={() => addIngredient(item)}>+ {item}</button>)}
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
          <input className="k-field" value={step} onChange={(e) => setStep(i, e.target.value)} placeholder={`Steg ${i + 1}`} aria-label={`Steg ${i + 1}`} />
          <button className="k-ed-btn" onClick={() => removeStep(i)} aria-label={`Ta bort steg ${i + 1}`}><X size={18} /></button>
        </div>
      ))}
      <button className="k-add-step" onClick={addStep}><Plus size={17} />Lägg till steg</button>

      {err && <p className="k-err" role="alert">{err}</p>}
    </Sheet>
  );
}
