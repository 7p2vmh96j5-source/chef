import { Bell } from "lucide-react";
import { CookCard, CookActions } from "../components/CookCard.jsx";

export function FeedScreen({ app }) {
  const visible = new Set(["me", ...app.data.following]);
  const items = app.allCooks
    .filter((c) => visible.has(c.userId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  return (
    <>
      <header className="k-lt k-lt-row">
        <h1>Start</h1>
        <button className="k-bell" onClick={app.openNotifs} aria-label={app.unread ? `Notiser, ${app.unread} olästa` : "Notiser"}>
          <Bell size={24} />
          {app.unread > 0 && <span className="k-badge">{app.unread > 9 ? "9+" : app.unread}</span>}
        </button>
      </header>
      {items.map((c) => (
        <div key={c.id} className="k-feed-item">
          <CookCard cook={c} app={app} />
          <CookActions cook={c} app={app} />
        </div>
      ))}
      <p className="k-end">Du är ikapp. Följ fler vänner för att se mer på startsidan.</p>
    </>
  );
}
