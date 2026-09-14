import { useEffect, useRef, useState } from "react";
import { LogOut, Pencil, Folder, MapPin, Trophy } from "lucide-react";
import { USERS } from "../data/users.js";
import { Sheet } from "./Sheet.jsx";
import { Avatar } from "../components/ui.jsx";
import { PhotoPicker } from "../components/PhotoPicker.jsx";

const MONTHS = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 101 }, (_, i) => currentYear - i);

export function ProfileSettingsSheet({ app, onClose }) {
  const current = app.data.profile || {};
  const [name, setName] = useState(current.name || "");
  const initialDate = current.birthDate ? current.birthDate.split("-") : [];
  const [birthYear, setBirthYear] = useState(initialDate[0] || "");
  const [birthMonth, setBirthMonth] = useState(initialDate[1] || "");
  const [birthDay, setBirthDay] = useState(initialDate[2] || "");
  const [location, setLocation] = useState(current.location || "");
  const [bio, setBio] = useState(current.bio || "");
  const [photo, setPhoto] = useState(app.photos["profile:me"] || null);
  const photoInputRef = useRef(null);

  const save = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const birthDate = birthYear && birthMonth && birthDay
      ? `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
      : "";
    app.updateProfile({ name: cleanName, birthDate, location: location.trim(), bio: bio.trim() }, photo);
    onClose();
  };

  const daysInMonth = birthYear && birthMonth ? new Date(Number(birthYear), Number(birthMonth), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  useEffect(() => {
    if (birthDay && Number(birthDay) > daysInMonth) setBirthDay("");
  }, [birthDay, daysInMonth]);

  return (
    <Sheet tall title="Redigera profil" onClose={onClose}
      footer={<button className="k-primary" disabled={!name.trim()} onClick={save}>Spara ändringar</button>}>
      <div className="k-settings-photo">
        <Avatar user={{ ...USERS.me, ...(app.data.profile || {}), photo }} size={88} />
        <button className="k-settings-photo-edit" onClick={() => photoInputRef.current && photoInputRef.current.click()} aria-label="Ändra profilbild">
          <Pencil size={15} />
        </button>
      </div>
      <div className="k-settings-photo-picker"><PhotoPicker value={photo} onChange={setPhoto} inputRef={photoInputRef} /></div>
      <label className="k-label" htmlFor="profile-name">Namn</label>
      <input id="profile-name" className="k-input" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="k-label">Födelsedatum</label>
      <div className="k-date-selects">
        <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} aria-label="Födelseår">
          <option value="">År</option>
          {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} aria-label="Födelsemånad">
          <option value="">Månad</option>
          {MONTHS.map((month, i) => <option key={month} value={i + 1}>{month}</option>)}
        </select>
        <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} aria-label="Födelsedag">
          <option value="">Dag</option>
          {days.map((day) => <option key={day} value={day}>{day}</option>)}
        </select>
      </div>
      <label className="k-label" htmlFor="profile-location">Stad/land</label>
      <input id="profile-location" className="k-input" value={location}
        onChange={(e) => setLocation(e.target.value.slice(0, 80))} placeholder="Var bor du?" />
      <label className="k-label" htmlFor="profile-bio">Bio</label>
      <textarea id="profile-bio" className="k-input" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))}
        placeholder="Skriv något om dig själv" style={{ minHeight: 90 }} />
      <button className="k-wide" onClick={() => app.setSheet({ type: "chef-titles" })}><Trophy size={17} />Kocktitlar</button>
      <button className="k-wide" style={{ marginTop: 8 }} onClick={() => app.setSheet({ type: "my-folders" })}><Folder size={17} />Mina mappar</button>
      <button className="k-wide" style={{ marginTop: 8 }} onClick={() => app.setSheet({ type: "my-restaurant-folders" })}><MapPin size={17} />Mina platsgrupper</button>
      <button className="k-logout k-settings-logout" onClick={app.logout}><LogOut size={15} />Logga ut</button>
    </Sheet>
  );
}
