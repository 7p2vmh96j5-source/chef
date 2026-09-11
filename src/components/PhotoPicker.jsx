import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { resizeImage } from "../lib/image.js";

export function PhotoPicker({ value, onChange, inputRef }) {
  const internalRef = useRef(null);
  const ref = inputRef || internalRef;
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Välj en bildfil."); return; }
    setBusy(true); setErr("");
    try { onChange(await resizeImage(file)); }
    catch (x) { setErr("Bilden kunde inte läsas. Prova en annan bild."); }
    setBusy(false);
  };

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" onChange={pick} hidden />
      {value ? (
        <div className="k-ph-grid">
          <div className="k-ph-prev">
            <img src={value} alt="Valt foto" />
            <button className="k-ph-x" onClick={() => onChange(null)} aria-label="Ta bort foto"><X size={16} strokeWidth={2.5} /></button>
          </div>
          <div className="k-ph-more" aria-label="Plats för ytterligare foto">
            <Camera size={20} />
            <span>Fler bilder</span>
          </div>
        </div>
      ) : (
        <div className="k-ph-grid">
          <button className="k-ph-add" onClick={() => ref.current && ref.current.click()} disabled={busy}>
            <Camera size={22} />{busy ? "Laddar foto…" : "Lägg till foto"}
          </button>
          <div className="k-ph-more" aria-label="Plats för ytterligare foto">
            <Camera size={20} />
            <span>Fler bilder</span>
          </div>
        </div>
      )}
      {err && <p className="k-err" role="alert">{err}</p>}
    </div>
  );
}
