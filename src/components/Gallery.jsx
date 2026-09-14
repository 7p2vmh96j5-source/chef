import { Images } from "lucide-react";
import { relDate } from "../lib/format.js";
import { photoList } from "../lib/photos.js";

export function Gallery({ cooks, app, empty }) {
  const list = [...cooks]
    .filter((c) => !(c.custom?.simple && photoList(app.photos[c.id]).length === 0))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (list.length === 0) return <p className="k-empty" style={{ marginTop: 14 }}>{empty}</p>;
  return (
    <div className="k-gal">
      {list.map((c) => {
        const r = app.recipeOf(c);
        if (!r) return null;
        const ownPhotos = photoList(app.photos[c.id]);
        const photos = ownPhotos.length ? ownPhotos : photoList(app.photos[r.id]);
        return (
          <button key={c.id} onClick={() => app.open("cook", c.id)} aria-label={`${r.title}, ${relDate(c.date).toLowerCase()}`}
            style={{ background: photos.length ? "#F2F2F7" : r.tile }}>
            {photos.length > 1 ? (
              <>
                <div className="k-gal-gallery">
                  {photos.map((src, i) => <img key={i} src={src} alt="" />)}
                </div>
                <span className="k-photo-count"><Images size={12} />{photos.length}</span>
              </>
            ) : photos.length === 1 ? <img src={photos[0]} alt="" /> : <span aria-hidden="true">{r.emoji}</span>}
          </button>
        );
      })}
    </div>
  );
}
