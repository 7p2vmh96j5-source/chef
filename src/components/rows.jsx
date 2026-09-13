import { ChevronRight, UserPlus, MapPin } from "lucide-react";
import { USERS } from "../data/users.js";
import { relDate } from "../lib/format.js";
import { photoList } from "../lib/photos.js";
import { Avatar, Tile, Stars } from "./ui.jsx";

export function RecipeRow({ r, sub, onClick, rank, photo }) {
  return (
    <button className="k-row" onClick={onClick}>
      {rank != null && <span className="k-rank">{rank}</span>}
      <Tile r={r} size={52} src={photo} />
      <span className="k-row-body">
        <span className="k-row-t">{r.title}</span>
        <span className="k-row-s">{sub}</span>
      </span>
      <ChevronRight size={18} color="#C7C7CC" />
    </button>
  );
}

export function RestaurantRow({ cook, app, onClick }) {
  const photo = photoList(app.photos[cook.id])[0];
  return (
    <button className="k-row" onClick={onClick}>
      {photo ? (
        <img src={photo} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", display: "block" }} />
      ) : (
        <span className="k-tile" aria-hidden="true" style={{ width: 52, height: 52, background: "#EEF0F3", borderRadius: 12, display: "grid", placeItems: "center" }}>
          <MapPin size={22} color="#8E8E93" />
        </span>
      )}
      <span className="k-row-body">
        <span className="k-row-t">{cook.custom.place}</span>
        <span className="k-row-s"><Stars value={cook.custom.rating} size={12} /> {relDate(cook.date)}</span>
      </span>
      <ChevronRight size={18} color="#C7C7CC" />
    </button>
  );
}

export function UserRow({ id, app, sub, right }) {
  const u = USERS[id];
  return (
    <div className="k-row">
      <button className="k-plain k-row-link" onClick={() => app.open("user", id)}>
        <Avatar user={u} size={40} />
        <span className="k-row-body">
          <span className="k-row-t">{u.name}</span>
          <span className="k-row-s">{sub}</span>
        </span>
      </button>
      {right}
    </div>
  );
}

export function FollowButton({ id, app }) {
  const isSelf = id === "me" || id === app.currentUserId;
  const on = app.data.following.includes(id);
  if (isSelf) return null;
  return (
    <button className={"k-follow" + (on ? " on" : "")} onClick={() => app.toggleFollow(id)}>
      {!on && <UserPlus size={15} />}{on ? "Följer" : "Följ"}
    </button>
  );
}
