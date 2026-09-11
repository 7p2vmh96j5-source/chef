import { useState } from "react";
import { USERS } from "../data/users.js";
import { first, times, relDate } from "../lib/format.js";
import { topRecipes, mutualText } from "../lib/social.js";
import { Avatar, Seg } from "../components/ui.jsx";
import { RecipeRow, FollowButton } from "../components/rows.jsx";
import { Gallery } from "../components/Gallery.jsx";

export function ProfileBody({ uid, app }) {
  const [seg, setSeg] = useState("gallery");
  const isMe = uid === "me";
  const u = isMe ? { ...USERS.me, ...(app.data.profile || {}), photo: app.photos["profile:me"] } : USERS[uid];
  const birthDate = isMe ? app.data.profile?.birthDate : null;
  const age = birthDate ? Math.max(0, Math.floor((Date.now() - new Date(`${birthDate}T00:00:00`).getTime()) / 31557600000)) : "";
  const cooks = app.cooksOf(uid);
  const authored = Object.values(app.recipes).filter((r) => r.author === uid);
  const myProfileRecipes = isMe
    ? [...new Map([
        ...app.data.myRecipes,
        ...Object.values(app.recipes).filter((r) => r.author === "me"),
        ...app.data.saved.map((id) => app.recipes[id]).filter(Boolean),
      ].map((recipe) => [recipe.id, recipe])).values()]
      .sort((a, b) => {
        const savedAt = app.data.recipeSavedAt || {};
        const aTime = savedAt[a.id] || a.created_at || "";
        const bTime = savedAt[b.id] || b.created_at || "";
        return bTime.localeCompare(aTime) || String(b.id).localeCompare(String(a.id));
      })
    : [];
  const savedByUser = isMe ? [] : app.savedOf(uid);
  const top = topRecipes(cooks);
  const recent = [...cooks].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const followingIds = app.followingOf(uid);
  const followerIds = app.followersOf(uid);
  const mutual = isMe ? [] : app.mutualWith(uid);
  const followsMe = !isMe && app.followingOf(uid).includes("me");

  const activity = (
    <>
      {top.length > 0 && (
        <>
          <h2 className="k-sh">Mest lagat</h2>
          <div className="k-list" style={{ "--inset": "110px" }}>
            {top.map(([rid, n], i) => {
              const r = app.recipes[rid];
              return r ? <RecipeRow key={rid} r={r} rank={i + 1} sub={`Lagat ${times(n)}`} onClick={() => app.open("recipe", rid)} /> : null;
            })}
          </div>
        </>
      )}
      <h2 className="k-sh">Senast lagat</h2>
      {recent.length === 0 ? <p className="k-empty">Inget loggat än.</p> : (
        <div className="k-list">
          {recent.map((c) => {
            const r = app.recipeOf(c);
            return r ? <RecipeRow key={c.id} r={r} photo={app.photos[c.id]} sub={relDate(c.date)} onClick={() => app.open("cook", c.id)} /> : null;
          })}
        </div>
      )}
    </>
  );

  const recipeList = (list, empty) =>
    list.length === 0 ? <p className="k-empty" style={{ marginTop: 14 }}>{empty}</p> : (
      <div className="k-list" style={{ marginTop: 6 }}>
        {list.map((r) => {
          const source = r.author === "me"
            ? "Ditt recept"
            : r.author && USERS[r.author]
              ? `Från ${first(USERS[r.author].name)}`
              : "Från Köket";
          return <RecipeRow key={r.id} r={r} sub={source} onClick={() => app.open("recipe", r.id)} />;
        })}
      </div>
    );

  return (
    <>
      <div className="k-prof">
        <div className="k-prof-top">
          <Avatar user={u} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{u.name}</h2>
            {isMe && age !== "" && <div className="k-meta">{age} år</div>}
            {isMe && u.location && <div className="k-meta">{u.location}</div>}
            {followsMe && <div className="k-meta">Följer dig</div>}
          </div>
          {!isMe && <FollowButton id={uid} app={app} />}
        </div>
        {u.bio && <p className="k-bio">{u.bio}</p>}
        {!isMe && (mutual.length > 0 ? (
          <button className="k-mutual" onClick={() => app.open("follows", uid, { tab: "mutual" })}>
            <span className="k-av-stack">{mutual.slice(0, 3).map((id) => <Avatar key={id} user={USERS[id]} size={24} ring="#fff" />)}</span>
            <span>{mutualText(mutual)}</span>
          </button>
        ) : (
          <p className="k-meta" style={{ margin: "12px 0 0" }}>Inga gemensamma vänner än</p>
        ))}
        <div className="k-stats big">
          <button onClick={() => app.open("follows", uid, { tab: "following" })}><span>Följer</span><b>{followingIds.length}</b></button>
          <button onClick={() => app.open("follows", uid, { tab: "followers" })}><span>Följare</span><b>{followerIds.length}</b></button>
          <div><span>Antal rätter</span><b>{cooks.length}</b></div>
          <div><span>Mina recept</span><b>{myProfileRecipes.length}</b></div>
        </div>
      </div>

      {isMe ? (
        <>
          <Seg value={seg} onChange={setSeg} options={[["gallery", "Galleri"], ["activity", "Aktivitet"], ["saved", "Mina recept"]]} />
          {seg === "activity" && activity}
          {seg === "gallery" && <Gallery cooks={cooks} app={app} empty="Inga matlagningar än. Logga din första så hamnar den här." />}
          {seg === "saved" && recipeList(
            myProfileRecipes,
            "Du har inga recept sparade ännu."
          )}
        </>
      ) : (
        <>
          <Seg value={seg} onChange={setSeg} options={[["gallery", "Galleri"], ["activity", "Aktivitet"], ["saved", "Sparat"]]} />
          {seg === "activity" && (
            <>
              {activity}
              <h2 className="k-sh">Recept av {first(u.name)}</h2>
              {recipeList(authored, `${first(u.name)} har inte publicerat några recept än.`)}
            </>
          )}
          {seg === "gallery" && <Gallery cooks={cooks} app={app} empty={`${first(u.name)} har inte loggat något än.`} />}
          {seg === "saved" && recipeList(savedByUser, `${first(u.name)} har inga sparade recept än.`)}
          <div style={{ height: 36 }} />
        </>
      )}
    </>
  );
}
