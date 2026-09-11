import { useState } from "react";
import { Sheet } from "./Sheet.jsx";
import { PhotoPicker } from "../components/PhotoPicker.jsx";

export function ProfilePhotoSheet({ app, onClose }) {
  const [photo, setPhoto] = useState(app.photos["profile:me"] || null);

  const save = () => {
    app.updateProfile({}, photo);
    onClose();
  };

  return (
    <Sheet title="Profilbild" onClose={onClose}
      footer={<button className="k-primary" onClick={save}>Spara profilbild</button>}>
      <PhotoPicker value={photo} onChange={setPhoto} />
      {photo && <p className="k-meta" style={{ marginTop: 10 }}>Tryck på krysset om du vill ta bort profilbilden.</p>}
    </Sheet>
  );
}
