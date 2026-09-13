import { useState } from "react";
import { Search, Plus, ChevronRight, X, MinusCircle, ChevronDown } from "lucide-react";
import { toItems, itemsToMods } from "../lib/variants.js";
import { Tile } from "../components/ui.jsx";
import { PhotoPicker } from "../components/PhotoPicker.jsx";
import { Sheet } from "./Sheet.jsx";
import { CustomLog } from "./CustomLog.jsx";

export function LogSheet({ app, initial, onClose }) {
  const [rid, setRid] = useState(initial || null);
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [photos, setPhotos] = useState([]);
  const [items, setItems] = useState(() => toItems(initial ? app.recipes[initial] : null));
  const [newIng, setNewIng] = useState("");
  const [showSteps, setShowSteps] = useState(false);
  const [steps, setSteps] = useState(() => app.recipes[initial]?.steps ? [...app.recipes[initial].steps] : []);
  const [custom, setCustom] = useState(false);
  const r = rid ? app.recipes[rid] : null;

  const choose = (id) => {
    setRid(id);
    setItems(toItems(app.recipes[id]));
    setSteps([...(app.recipes[id].steps || [])]);
    setShowSteps(false);
    setNewIng("");
  };
  const update = (key, patch) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const drop = (key) => setItems((xs) => xs.filter((x) => x.key !== key));
  const add = () => {
    const t = newIng.trim();
    if (!t) return;
    setItems((xs) => [...xs, { key: "n" + Date.now(), orig: null, text: t, removed: false }]);
    setNewIng("");
  };

  const mods = itemsToMods(items);
  const nChanges = mods ? mods.removed.length + mods.added.length + mods.changed.length : 0;
  const currentIngredients = items.filter((it) => !it.removed && it.text.trim()).map((it) => it.text.trim());
  const stepsChanged = steps.length !== r?.steps.length || steps.some((step, i) => step.trim() !== (r?.steps[i] || "").trim());
  const hasOwnVariant = nChanges > 0 || stepsChanged;
  const ownRecipe = hasOwnVariant && r ? {
    title: r.title,
    category: r.category,
    emoji: r.emoji,
    time: r.time,
    makes: r.makes,
    ingredients: currentIngredients,
    steps: steps.map((step) => step.trim()).filter(Boolean),
  } : null;

  // Skapa eget: egen rätt utan recept
  if (custom) {
    return <CustomLog app={app} onClose={onClose} onBack={() => setCustom(false)} initialTitle={q.trim()} />;
  }

  // Steg 1: välj recept
  if (!r) {
    const ql = q.trim().toLowerCase();
    const all = Object.values(app.recipes);
    const knownTitles = new Set(all.filter((x) => x.author == null).map((x) => x.title.trim().toLowerCase()));
    const list = all.filter((x) => x.author == null || !knownTitles.has(x.title.trim().toLowerCase()))
      .filter((x) => !ql || x.title.toLowerCase().includes(ql));
    return (
      <Sheet tall title="Logga matlagning" onClose={onClose} bodyKey="pick"
        footer={<button className="k-primary" disabled>Välj ett recept</button>}>
        <label className="k-label" style={{ marginTop: 4 }}>Vad lagade du?</label>
        <label className="k-search" style={{ margin: "0 0 4px" }}>
          <Search size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sök bland recept" aria-label="Sök bland recept" />
        </label>
        <button className="k-create" onClick={() => setCustom(true)}>
          <span className="k-create-i"><Plus size={22} strokeWidth={2.4} /></span>
          <span style={{ flex: 1 }}>
            <b>Skapa eget</b>
            <small>{ql ? `Logga ”${q.trim()}” och välj själv vad du hade i` : "Välj själv vad du hade i"}</small>
          </span>
          <ChevronRight size={18} color="#8A7A4E" />
        </button>
        {list.length === 0 && <p className="k-empty" style={{ padding: "12px 0" }}>Inget recept matchar. Använd Skapa eget ovan.</p>}
        {list.map((x) => (
          <button key={x.id} className="k-pick" onClick={() => choose(x.id)}>
            <Tile r={x} size={40} radius={10} />
            <span style={{ flex: 1 }}>{x.title}</span>
            <ChevronRight size={18} color="#C7C7CC" />
          </button>
        ))}
      </Sheet>
    );
  }

  // Steg 2: receptet, justeringar, foto och kommentar
  return (
    <Sheet tall title="Logga matlagning" onClose={onClose} bodyKey={"log-" + rid}
      footer={<button className="k-primary" onClick={() => app.logCook(ownRecipe ? null : rid, note.trim(), photos, ownRecipe ? null : mods, ownRecipe, ownRecipe ? null : steps)}>Publicera</button>}>
      <div className="k-log-rec">
        <Tile r={r} size={56} />
        <span className="k-row-body">
          <span className="k-row-t">{r.title}</span>
        </span>
        <button className="k-link-sm" onClick={() => setRid(null)}>Byt recept</button>
      </div>

      <label className="k-label" style={{ marginTop: 12 }}>Foto</label>
      <PhotoPicker multiple value={photos} onChange={setPhotos} />
      <label className="k-label" htmlFor="k-note">Hur blev det?</label>
      <textarea id="k-note" className="k-input" style={{ minHeight: 76 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Berätta för dina vänner (valfritt)" />

      <div className="k-ed-head">
        <h3>Ingredienser</h3>
        <span className="k-meta">{nChanges === 0 ? "Som i receptet" : `${nChanges} ${nChanges === 1 ? "ändring" : "ändringar"}`}</span>
      </div>
      <p className="k-meta" style={{ margin: "0 0 4px" }}>Tryck på en rad för att ändra den.</p>
      {items.map((it) => {
        const isNew = it.orig == null;
        const changed = !isNew && !it.removed && it.text.trim() !== it.orig;
        return (
          <div key={it.key} className={"k-ed" + (it.removed ? " removed" : "")}>
            <input value={it.text} disabled={it.removed} aria-label={`Ingrediens: ${it.orig || it.text}`}
              onChange={(e) => update(it.key, { text: e.target.value })} />
            {isNew && <span className="k-tag added">Ny</span>}
            {changed && <span className="k-tag changed">Ändrad</span>}
            {isNew ? (
              <button className="k-ed-btn" onClick={() => drop(it.key)} aria-label={`Ta bort ${it.text}`}><X size={18} /></button>
            ) : it.removed ? (
              <button className="k-ed-undo" onClick={() => update(it.key, { removed: false })}>Ångra</button>
            ) : changed ? (
              <button className="k-ed-undo" onClick={() => update(it.key, { text: it.orig })}>Ångra</button>
            ) : (
              <button className="k-ed-btn" onClick={() => update(it.key, { removed: true })} aria-label={`Ta bort ${it.orig}`}><MinusCircle size={20} /></button>
            )}
          </div>
        );
      })}
      <div className="k-ed-add">
        <input className="k-field" value={newIng} placeholder="Lägg till något du hade i"
          onChange={(e) => setNewIng(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} aria-label="Ny ingrediens" />
        <button className="k-send" disabled={!newIng.trim()} onClick={add} aria-label="Lägg till ingrediens"><Plus size={18} strokeWidth={2.5} /></button>
      </div>

      {steps.length > 0 && (
        <>
          <button className="k-toggle" onClick={() => setShowSteps((s) => !s)} aria-expanded={showSteps}>
            {showSteps ? "Dölj hur man gör" : `Visa hur man gör (${steps.length} steg)`}
            <ChevronDown size={18} style={{ transform: showSteps ? "rotate(180deg)" : "none" }} />
          </button>
          {showSteps && (
            <div className="k-step-editor" style={{ marginTop: 8 }}>
              <p className="k-meta" style={{ margin: "0 0 6px" }}>Ändra stegen för just den här matlagningen.</p>
              {steps.map((step, i) => (
                <div key={i} className="k-step-edit" style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6 }}>
                  <span className="k-meta" style={{ paddingTop: 9, minWidth: 18 }}>{i + 1}.</span>
                  <textarea className="k-input" value={step} aria-label={`Steg ${i + 1}`}
                    onChange={(e) => setSteps((xs) => xs.map((x, n) => n === i ? e.target.value : x))}
                    style={{ minHeight: 54, flex: 1 }} />
                  <button className="k-ed-btn" onClick={() => setSteps((xs) => xs.filter((_, n) => n !== i))} aria-label={`Ta bort steg ${i + 1}`}><X size={18} /></button>
                </div>
              ))}
              <button className="k-link-sm" onClick={() => setSteps((xs) => [...xs, ""])}><Plus size={15} /> Lägg till steg</button>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
