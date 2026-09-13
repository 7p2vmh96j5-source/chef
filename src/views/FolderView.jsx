import { USERS } from "../data/users.js";
import { first } from "../lib/format.js";
import { NavBar } from "../components/ui.jsx";
import { RecipeRow } from "../components/rows.jsx";

export function FolderView({ id, app }) {
  const folder = (app.data.recipeFolders || []).find((f) => f.id === id);
  const folderOf = app.data.recipeFolderOf || {};
  const list = app.myRecipesList.filter((r) => folderOf[r.id] === id);

  if (!folder) return (<><NavBar onBack={app.back} title="" /><p className="k-empty" style={{ marginTop: 20 }}>Mappen finns inte längre.</p></>);

  return (
    <>
      <NavBar onBack={app.back} title={folder.name} />
      <div className="k-scroll">
        {list.length === 0 ? (
          <p className="k-empty" style={{ marginTop: 14 }}>Inga recept i den här mappen än.</p>
        ) : (
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
        )}
      </div>
    </>
  );
}
