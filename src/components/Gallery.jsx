import { relDate } from "../lib/format.js";
import { photoList } from "../lib/photos.js";

export function Gallery({ cooks, app, empty }) {
  const list = [...cooks].sort((a, b) => b.date.localeCompare(a.date));
  if (list.length === 0) return <p className="k-empty" style={{ marginTop: 14 }}>{empty}</p>;
  return (
    <div className="k-gal">
      {list.map((c) => {
        const r = app.recipeOf(c);
        if (!r) return null;
        const ownPhotos = photoList(app.photos[c.id]);
        const src = (ownPhotos.length ? ownPhotos : photoList(app.photos[r.id]))[0];
        return (
          <button key={c.id} onClick={() => app.open("cook", c.id)} aria-label={`${r.title}, ${relDate(c.date).toLowerCase()}`}
            style={{ background: src ? "#F2F2F7" : r.tile }}>
            {src ? <img src={src} alt="" /> : <span aria-hidden="true">{r.emoji}</span>}
          </button>
        );
      })}
    </div>
  );
}
