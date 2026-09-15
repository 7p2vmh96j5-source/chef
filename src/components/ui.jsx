import { useContext } from "react";
import { ChevronLeft, ChefHat, Star } from "lucide-react";
import { PhotoCtx } from "../lib/photoContext.js";
import { photoList } from "../lib/photos.js";

export function Avatar({ user, size = 40, ring }) {
  const photos = useContext(PhotoCtx);
  const photo = user.id === "me" ? (photos["profile:me"] || user.photo) : user.photo;
  const ini = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("");
  if (photo) {
    return <img className="k-av" src={photo} alt="" style={{ width: size, height: size, objectFit: "cover", background: user.color, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }} />;
  }
  return (
    <span className="k-av" aria-hidden="true"
      style={{ width: size, height: size, background: user.color, color: user.fg || "#fff", fontSize: size * 0.38, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}>
      {ini}
    </span>
  );
}

export function Tile({ r, size = 56, radius = 12, font, src }) {
  const photos = useContext(PhotoCtx);
  const dim = typeof size === "number" ? { width: size, height: size } : { width: "100%", aspectRatio: "1" };
  const image = src || photoList(photos[r.id])[0];
  if (image) {
    return <img className="k-tile" src={image} alt="" style={{ ...dim, borderRadius: radius, objectFit: "cover", display: "block" }} />;
  }
  return (
    <span className="k-tile" aria-hidden="true"
      style={{ ...dim, background: r.tile, borderRadius: radius, fontSize: font || (typeof size === "number" ? size * 0.52 : 64) }}>
      {r.emoji}
    </span>
  );
}

export function Stars({ value, size = 14 }) {
  if (!value) return null;
  return (
    <span className="k-stars" aria-label={`${value} av 5 stjärnor`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const pct = value >= n ? 100 : value >= n - 0.5 ? 50 : 0;
        return (
          <span key={n} className="k-star-wrap" style={{ width: size, height: size }}>
            <Star size={size} fill="none" color="#C7C7CC" />
            {pct > 0 && (
              <span className="k-star-fill" style={{ width: `${pct}%` }}>
                <Star size={size} fill="#FFB800" color="#FFB800" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export function Stats({ cookedCount }) {
  if (cookedCount === undefined) return null;
  return (
    <div className="k-stats">
      <div><span><ChefHat size={14} /> Lagat</span><b>{cookedCount}</b></div>
    </div>
  );
}

export function Seg({ value, onChange, options }) {
  return (
    <div className="k-seg" role="tablist">
      {options.map(([v, l]) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

export function NavBar({ onBack, title, right }) {
  return (
    <div className="k-nav">
      <button className="k-back" onClick={onBack}><ChevronLeft size={28} strokeWidth={2.2} />Tillbaka</button>
      <div className="k-nav-t">{title}</div>
      <div className="k-nav-r">{right}</div>
    </div>
  );
}
