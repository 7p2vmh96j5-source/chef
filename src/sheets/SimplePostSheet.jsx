import { useState } from "react";
import { Star, Plus } from "lucide-react";
import { PhotoPicker } from "../components/PhotoPicker.jsx";
import { photoList } from "../lib/photos.js";
import { Sheet } from "./Sheet.jsx";

function StarPicker({ value, onChange }) {
  return (
    <div className="k-star-picker" role="radiogroup" aria-label="Betyg">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n}
          onClick={() => onChange(value === n ? 0 : n)} aria-label={`${n} av 5 stjärnor`}>
          <Star size={26} fill={n <= value ? "#FFB800" : "none"} color={n <= value ? "#FFB800" : "#C7C7CC"} />
        </button>
      ))}
    </div>
  );
}

export function SimplePostSheet({ app, onClose, editCook }) {
  const editing = !!editCook;
  const [text, setText] = useState(editCook ? (editCook.custom.title || "") : "");
  const [photos, setPhotos] = useState(() => editCook ? photoList(app.photos[editCook.id]) : []);
  const [place, setPlace] = useState(editCook ? (editCook.custom.place || "") : "");
  const [rating, setRating] = useState(editCook ? (editCook.custom.rating || 0) : 0);
  const [folderId, setFolderId] = useState(() => editCook ? (app.data.restaurantFolderOf?.[editCook.id] || null) : null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const canPublish = text.trim().length > 0 && photos.length > 0;
  const folders = app.data.restaurantFolders || [];

  const createFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const id = app.createRestaurantFolder(trimmed);
    setFolderId(id);
    setNewFolderName("");
    setCreatingFolder(false);
  };

  const publish = () => {
    const custom = {
      title: text.trim(),
      category: "Delat",
      emoji: "🍽️",
      makes: "",
      ingredients: [],
      steps: [],
      simple: true,
      place: place.trim() || null,
      rating: place.trim() ? rating || null : null,
    };
    const chosenFolderId = place.trim() ? folderId : null;
    if (editing) app.updateCook(editCook.id, { note: "", photos, custom, folderId: chosenFolderId });
    else app.logCook(null, "", photos, null, custom, null, chosenFolderId);
  };

  return (
    <Sheet tall title={editing ? "Redigera inlägg" : "Lägg till inlägg"} onClose={onClose}
      footer={<button className="k-primary" disabled={!canPublish} onClick={publish}>{editing ? "Spara ändringar" : "Publicera"}</button>}>
      <label className="k-label" style={{ marginTop: 4 }}>Bild</label>
      <PhotoPicker multiple value={photos} onChange={setPhotos} />
      <label className="k-label" htmlFor="k-simple-text">Vad vill du dela?</label>
      <textarea id="k-simple-text" className="k-input" style={{ minHeight: 90 }} value={text}
        onChange={(e) => setText(e.target.value)} placeholder="Till exempel: Åt ute på en fantastisk restaurang ikväll!" />

      <label className="k-label" htmlFor="k-simple-place">Plats (valfritt)</label>
      <input id="k-simple-place" className="k-input" value={place} onChange={(e) => setPlace(e.target.value)}
        placeholder="Till exempel namnet på restaurangen eller baren" />

      {place.trim() && (
        <>
          <label className="k-label">Betyg</label>
          <StarPicker value={rating} onChange={setRating} />

          <label className="k-label">Grupp (valfritt)</label>
          <div className="k-chips" style={{ padding: 0, flexWrap: "wrap" }}>
            <button type="button" className={"k-chip" + (!folderId ? " on" : "")} onClick={() => setFolderId(null)}>Ingen grupp</button>
            {folders.map((f) => (
              <button key={f.id} type="button" className={"k-chip" + (folderId === f.id ? " on" : "")} onClick={() => setFolderId(f.id)}>{f.name}</button>
            ))}
            {!creatingFolder && (
              <button type="button" className="k-chip" onClick={() => setCreatingFolder(true)}><Plus size={14} /> Ny grupp</button>
            )}
          </div>
          {creatingFolder && (
            <div className="k-ed-add">
              <input className="k-field" autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createFolder()} placeholder="Gruppnamn" aria-label="Namn på ny grupp" />
              <button className="k-send" disabled={!newFolderName.trim()} onClick={createFolder} aria-label="Skapa grupp"><Plus size={18} strokeWidth={2.5} /></button>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
