import { USERS } from "../data/users.js";
import { first, relDate } from "../lib/format.js";
import { Avatar, Tile, NavBar } from "../components/ui.jsx";
import { FollowButton } from "../components/rows.jsx";

export function NotifsView({ app, seenBefore }) {
  const fresh = app.notifs.filter((n) => n.date > seenBefore);
  const old = app.notifs.filter((n) => n.date <= seenBefore);

  const row = (n, isNew) => {
    const u = USERS[n.userId];
    const r = n.recipeId ? app.recipes[n.recipeId] : n.cookId ? app.recipeOf(app.allCooks.find((c) => c.id === n.cookId)) : null;
    const name = <b>{first(u.name)}</b>;
    let text, go;
    if (n.type === "mums") { text = <>{name} tyckte mums om {r ? r.title : "din matlagning"}</>; go = () => app.open("cook", n.cookId); }
    else if (n.type === "comment") { text = <>{name} kommenterade {r ? r.title : "din matlagning"}: ”{n.text}”</>; go = () => app.open("cook", n.cookId); }
    else if (n.type === "save") { text = <>{name} sparade {r ? r.title : "ditt recept"}</>; go = () => app.open("recipe", n.recipeId); }
    else if (n.type === "cooked") { text = <>{name} lagade {r ? r.title : "din rätt"}</>; go = () => app.open("cook", n.cookId); }
    else if (n.type === "share") { text = <>{name} delade {r ? r.title : "ett recept"} med dig</>; go = () => app.open("recipe", n.recipeId); }
    else { text = <>{name} började följa dig</>; go = () => app.open("user", n.userId); }

    return (
      <div key={n.key} className={"k-notif" + (isNew ? " new" : "")}>
        <button className="k-plain k-row-link" onClick={go}>
          <Avatar user={u} size={40} />
          <span className="k-row-body">
            <span className="k-notif-t">{text}</span>
            <span className="k-row-s">{relDate(n.date)}</span>
          </span>
        </button>
        {n.type === "follow" ? <FollowButton id={n.userId} app={app} /> : r ? <Tile r={r} size={44} radius={10} /> : null}
      </div>
    );
  };

  return (
    <>
      <NavBar onBack={app.back} title="Notiser" />
      <div className="k-scroll">
        {app.notifs.length === 0 && (
          <p className="k-empty" style={{ marginTop: 20 }}>Inga notiser än. När vänner tycker mums om eller kommenterar det du lagar syns det här.</p>
        )}
        {fresh.length > 0 && (<><h2 className="k-sh" style={{ marginTop: 16 }}>Nytt</h2>{fresh.map((n) => row(n, true))}</>)}
        {old.length > 0 && (<><h2 className="k-sh" style={{ marginTop: fresh.length ? 26 : 16 }}>Tidigare</h2>{old.map((n) => row(n, false))}</>)}
        <div style={{ height: 32 }} />
      </div>
    </>
  );
}
