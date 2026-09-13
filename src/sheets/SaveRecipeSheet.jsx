import { useState } from "react";
import { Bookmark, Folder, FolderPlus, ChevronRight } from "lucide-react";
import { Sheet } from "./Sheet.jsx";

export function SaveRecipeSheet({ app, recipeId, onClose }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const folders = app.data.recipeFolders || [];
  const folderOf = app.data.recipeFolderOf || {};
  const countIn = (folderId) => app.myRecipesList.filter((r) => folderOf[r.id] === folderId).length;

  if (creating) {
    return (
      <Sheet title="Ny mapp" onClose={onClose} bodyKey="new-folder"
        footer={<button className="k-primary" disabled={!name.trim()} onClick={() => app.createFolderAndSave(recipeId, name)}>Skapa och spara</button>}>
        <label className="k-label" htmlFor="folder-name" style={{ marginTop: 4 }}>Mappnamn</label>
        <input id="folder-name" className="k-input" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Till exempel Efterrätter" autoFocus />
      </Sheet>
    );
  }

  return (
    <Sheet title="Spara recept" onClose={onClose} bodyKey="save-to">
      <button className="k-pick" onClick={() => app.saveRecipeToFolder(recipeId, null)}>
        <Bookmark size={20} />
        <span style={{ flex: 1 }}>Bara spara</span>
        <ChevronRight size={18} color="#C7C7CC" />
      </button>
      {folders.map((f) => (
        <button key={f.id} className="k-pick" onClick={() => app.saveRecipeToFolder(recipeId, f.id)}>
          <Folder size={20} />
          <span style={{ flex: 1 }}>{f.name}</span>
          <span className="k-meta">{countIn(f.id)}</span>
          <ChevronRight size={18} color="#C7C7CC" />
        </button>
      ))}
      <button className="k-pick" onClick={() => setCreating(true)}>
        <span className="k-add-i"><FolderPlus size={16} /></span>
        <span style={{ flex: 1 }}>Skapa ny mapp</span>
      </button>
    </Sheet>
  );
}
