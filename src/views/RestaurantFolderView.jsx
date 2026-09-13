import { NavBar } from "../components/ui.jsx";
import { RestaurantRow } from "../components/rows.jsx";

export function RestaurantFolderView({ id, app }) {
  const folder = (app.data.restaurantFolders || []).find((f) => f.id === id);
  const folderOf = app.data.restaurantFolderOf || {};
  const list = app.cooksOf("me")
    .filter((c) => c.custom?.place && folderOf[c.id] === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!folder) return (<><NavBar onBack={app.back} title="" /><p className="k-empty" style={{ marginTop: 20 }}>Gruppen finns inte längre.</p></>);

  return (
    <>
      <NavBar onBack={app.back} title={folder.name} />
      <div className="k-scroll">
        {list.length === 0 ? (
          <p className="k-empty" style={{ marginTop: 14 }}>Inga platser i den här gruppen än.</p>
        ) : (
          <div className="k-list" style={{ marginTop: 6 }}>
            {list.map((c) => <RestaurantRow key={c.id} cook={c} app={app} onClick={() => app.open("cook", c.id)} />)}
          </div>
        )}
      </div>
    </>
  );
}
