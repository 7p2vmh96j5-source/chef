import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { resizeImage } from "../lib/image.js";
import { photoList } from "../lib/photos.js";

const MAX_PHOTOS = 4;

export function PhotoPicker({ value, onChange, inputRef, multiple = false, max = MAX_PHOTOS }) {
  const internalRef = useRef(null);
  const ref = inputRef || internalRef;
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (multiple) {
    const photos = photoList(value);
    const canAddMore = photos.length < max;

    const pick = async (e) => {
      const files = Array.from(e.target.files || []).slice(0, max - photos.length);
      e.target.value = "";
      if (!files.length) return;
      const bad = files.find((file) => !file.type.startsWith("image/"));
      if (bad) { setErr("Välj en bildfil."); return; }
      setBusy(true); setErr("");
      try {
        const resized = await Promise.all(files.map((file) => resizeImage(file)));
        onChange([...photos, ...resized]);
      } catch (x) { setErr("Bilden kunde inte läsas. Prova en annan bild."); }
      setBusy(false);
    };

    return (
      <div>
        <input ref={ref} type="file" accept="image/*" multiple onChange={pick} hidden />
        <div className="k-ph-grid">
          {photos.map((src, i) => (
            <div className="k-ph-prev" key={i}>
              <img src={src} alt={`Foto ${i + 1}`} />
              <button className="k-ph-x" onClick={() => onChange(photos.filter((_, idx) => idx !== i))} aria-label={`Ta bort foto ${i + 1}`}><X size={16} strokeWidth={2.5} /></button>
            </div>
          ))}
          {canAddMore && (
            <button className="k-ph-add" onClick={() => ref.current && ref.current.click()} disabled={busy}>
              <Camera size={22} />{busy ? "Laddar foto…" : photos.length ? "Fler bilder" : "Lägg till foto"}
            </button>
          )}
        </div>
        {err && <p className="k-err" role="alert">{err}</p>}
      </div>
    );
  }

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
        </div>
      ) : (
        <div className="k-ph-grid">
          <button className="k-ph-add" onClick={() => ref.current && ref.current.click()} disabled={busy}>
            <Camera size={22} />{busy ? "Laddar foto…" : "Lägg till foto"}
          </button>
        </div>
      )}
      {err && <p className="k-err" role="alert">{err}</p>}
    </div>
  );
}
