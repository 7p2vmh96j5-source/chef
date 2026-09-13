import { useState } from "react";
import { PhotoPicker } from "../components/PhotoPicker.jsx";
import { photoList } from "../lib/photos.js";
import { Sheet } from "./Sheet.jsx";

export function SimplePostSheet({ app, onClose, editCook }) {
  const editing = !!editCook;
  const [text, setText] = useState(editCook ? (editCook.custom.title || "") : "");
  const [photos, setPhotos] = useState(() => editCook ? photoList(app.photos[editCook.id]) : []);
  const canPublish = text.trim().length > 0 && photos.length > 0;

  const publish = () => {
    const custom = {
      title: text.trim(),
      category: "Delat",
      emoji: "🍽️",
      makes: "",
      ingredients: [],
      steps: [],
      simple: true,
    };
    if (editing) app.updateCook(editCook.id, { note: "", photos, custom });
    else app.logCook(null, "", photos, null, custom);
  };

  return (
    <Sheet tall title={editing ? "Redigera inlägg" : "Lägg till inlägg"} onClose={onClose}
      footer={<button className="k-primary" disabled={!canPublish} onClick={publish}>{editing ? "Spara ändringar" : "Publicera"}</button>}>
      <label className="k-label" style={{ marginTop: 4 }}>Bild</label>
      <PhotoPicker multiple value={photos} onChange={setPhotos} />
      <label className="k-label" htmlFor="k-simple-text">Vad vill du dela?</label>
      <textarea id="k-simple-text" className="k-input" style={{ minHeight: 90 }} value={text}
        onChange={(e) => setText(e.target.value)} placeholder="Till exempel: Åt ute på en fantastisk restaurang ikväll!" />
    </Sheet>
  );
}
