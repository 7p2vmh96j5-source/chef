import { useState } from "react";
import { USERS } from "../data/users.js";
import { first } from "../lib/format.js";
import { Seg, NavBar } from "../components/ui.jsx";
import { UserRow, FollowButton } from "../components/rows.jsx";

export function FollowsView({ uid, tab: initialTab, app }) {
  const isMe = uid === "me";
  const [tab, setTab] = useState(initialTab || "following");
  const u = USERS[uid];
  const name = first(u.name);
  const lists = {
    following: app.followingOf(uid),
    followers: app.followersOf(uid),
    mutual: isMe ? [] : app.mutualWith(uid),
  };
  const options = [
    ["following", `Följer ${lists.following.length}`],
    ["followers", `Följare ${lists.followers.length}`],
    ...(isMe ? [] : [["mutual", `Gemensamma ${lists.mutual.length}`]]),
  ];
  const empty = {
    following: isMe ? "Du följer ingen än. Hitta vänner under Upptäck eller Vänner." : `${name} följer ingen än.`,
    followers: isMe ? "Ingen följer dig än." : `Ingen följer ${name} än.`,
    mutual: `Du och ${name} har inga gemensamma vänner än.`,
  };
  const myFollowers = app.followersOf("me");
  const sub = (id) => (id === "me" ? "Du" : !(isMe && tab === "followers") && myFollowers.includes(id) ? "Följer dig" : USERS[id].bio);
  const ids = lists[tab] || [];

  return (
    <>
      <NavBar onBack={app.back} title={u.name} />
      <div className="k-scroll">
        <div style={{ marginTop: -12 }}><Seg value={tab} onChange={setTab} options={options} /></div>
        {tab === "mutual" && ids.length > 0 && (
          <p className="k-meta" style={{ margin: "12px 16px 0" }}>Personer du följer som också är vänner med {name}.</p>
        )}
        {ids.length === 0 ? (
          <p className="k-empty" style={{ marginTop: 16 }}>{empty[tab]}</p>
        ) : (
          <div className="k-list" style={{ "--inset": "68px", marginTop: 8 }}>
            {ids.map((id) => (
              <UserRow key={id} id={id} app={app} sub={sub(id)} right={id === "me" ? null : <FollowButton id={id} app={app} />} />
            ))}
          </div>
        )}
        <div style={{ height: 32 }} />
      </div>
    </>
  );
}
