import { ChevronRight, UserPlus } from "lucide-react";
import { USERS } from "../data/users.js";
import { Avatar, Tile } from "./ui.jsx";

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
