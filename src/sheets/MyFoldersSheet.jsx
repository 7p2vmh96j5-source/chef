import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { Sheet } from "./Sheet.jsx";

function FolderRow({ folder, count, app, onRequestDelete }) {
  const [name, setName] = useState(folder.name);
  const commit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== folder.name) app.renameFolder(folder.id, trimmed);
    else setName(folder.name);
  };
  return (
    <div className="k-ed">
      <input value={name} onChange={(e) => setName(e.target.value)}
        onBlur={commit} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        aria-label={`Mappnamn, ${folder.name}`} />
      <span className="k-meta" style={{ flexShrink: 0 }}>{count}</span>
      <button className="k-ed-btn" onClick={() => onRequestDelete(folder)} aria-label={`Ta bort mappen ${folder.name}`}>
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export function MyFoldersSheet({ app, onClose }) {
  const [deleting, setDeleting] = useState(null);
  const folders = app.data.recipeFolders || [];
  const folderOf = app.data.recipeFolderOf || {};
  const countIn = (id) => app.myRecipesList.filter((r) => folderOf[r.id] === id).length;

  return (
    <Sheet title="Mina mappar" onClose={onClose} bodyKey="my-folders">
      {folders.length === 0 ? (
        <p className="k-empty" style={{ padding: 0 }}>Du har inga mappar än. Skapa en när du sparar ett recept.</p>
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
