import { USERS } from "../data/users.js";
import { NavBar } from "../components/ui.jsx";
import { ProfileBody } from "../screens/ProfileBody.jsx";

export function UserView({ id, app }) {
  return (
    <>
      <NavBar onBack={app.back} title={USERS[id].name} />
      <div className="k-scroll" style={{ paddingTop: 12 }}><ProfileBody uid={id} app={app} /></div>
    </>
  );
}
