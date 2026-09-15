import { LogOut, Pencil, Folder, MapPin, Trophy, Moon } from "lucide-react";
import { Sheet } from "./Sheet.jsx";

export function ProfileSettingsSheet({ app, onClose }) {
  const dark = !!app.data.darkMode;
  return (
    <Sheet title="Inställningar" onClose={onClose}>
      <button className="k-wide" onClick={() => app.setSheet({ type: "edit-profile" })}><Pencil size={17} />Redigera profil</button>
      <button className="k-wide" style={{ marginTop: 8, justifyContent: "space-between" }} onClick={app.toggleDarkMode} aria-pressed={dark}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Moon size={17} />Mörkt läge</span>
        <span className={"k-switch" + (dark ? " on" : "")}><span /></span>
      </button>
      <button className="k-wide" style={{ marginTop: 8 }} onClick={() => app.setSheet({ type: "chef-titles" })}><Trophy size={17} />Kocktitlar</button>
      <button className="k-wide" style={{ marginTop: 8 }} onClick={() => app.setSheet({ type: "my-folders" })}><Folder size={17} />Mina mappar</button>
      <button className="k-wide" style={{ marginTop: 8 }} onClick={() => app.setSheet({ type: "my-restaurant-folders" })}><MapPin size={17} />Mina platsgrupper</button>
      <button className="k-logout k-settings-logout" onClick={app.logout}><LogOut size={15} />Logga ut</button>
    </Sheet>
  );
}
