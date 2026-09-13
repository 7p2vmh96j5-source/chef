import { useState } from "react";
import { Trash2, Pencil, X, Plus } from "lucide-react";
import { Sheet } from "./Sheet.jsx";

function FolderRow({ folder, count, app, onRequestDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(folder.name);

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== folder.name) app.renameFolder(folder.id, trimmed);
    else setName(folder.name);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="k-ed">
        <input value={name} autoFocus onChange={(e) => setName(e.target.value)}
          onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()}
          aria-label={`Byt namn på mappen ${folder.name}`} />
        <button className="k-ed-btn" onClick={() => onRequestDelete(folder)} aria-label={`Ta bort mappen ${folder.name}`}>
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="k-ing">
      <span style={{ flex: 1 }}>{folder.name}</span>
      <span className="k-meta" style={{ flexShrink: 0 }}>{count}</span>
      <button className="k-ed-btn" onClick={() => setEditing(true)} aria-label={`Byt namn på mappen ${folder.name}`}>
        <Pencil size={16} />
      </button>
      <button className="k-ed-btn" onClick={() => onRequestDelete(folder)} aria-label={`Ta bort mappen ${folder.name}`}>
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export function MyFoldersSheet({ app, onClose }) {
  const [deleting, setDeleting] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const folders = app.data.recipeFolders || [];
  const folderOf = app.data.recipeFolderOf || {};
  const countIn = (id) => app.myRecipesList.filter((r) => folderOf[r.id] === id).length;

  const createFolder = () => {
    if (!newName.trim()) return;
    app.createFolder(newName);
    setNewName("");
    setCreating(false);
  };

  return (
    <Sheet title="Mina mappar" onClose={onClose} bodyKey="my-folders"
      right={<button className="k-nav-btn" style={{ justifySelf: "end" }} onClick={() => setCreating(true)} aria-label="Skapa ny mapp"><Plus size={20} /></button>}>
      {creating && (
        <div className="k-ed-add" style={{ marginTop: 4 }}>
          <input className="k-field" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()} placeholder="Mappnamn" aria-label="Namn på ny mapp" />
          <button className="k-send" disabled={!newName.trim()} onClick={createFolder} aria-label="Skapa mapp"><Plus size={18} strokeWidth={2.5} /></button>
        </div>
      )}

      {folders.length === 0 ? (
        <p className="k-empty" style={{ padding: 0 }}>Du har inga mappar än. Skapa en med plusset uppe till höger.</p>
      ) : folders.map((f) => (
        <FolderRow key={f.id} folder={f} count={countIn(f.id)} app={app} onRequestDelete={setDeleting} />
      ))}

      {deleting && (
        <div className="k-confirm-backdrop" role="presentation">
          <div className="k-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-folder-title">
            <button className="k-confirm-close" aria-label="Stäng" onClick={() => setDeleting(null)}><X size={18} /></button>
            <h2 id="delete-folder-title">Ta bort mappen?</h2>
            <p>Recepten i mappen tas inte bort, men blir osorterade under Mina recept.</p>
            <div className="k-confirm-actions">
              <button className="k-confirm-yes" onClick={() => { app.deleteFolder(deleting.id); setDeleting(null); }}>Ja, ta bort</button>
              <button className="k-confirm-no" onClick={() => setDeleting(null)}>Nej</button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
