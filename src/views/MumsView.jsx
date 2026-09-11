import { USERS } from "../data/users.js";
import { first } from "../lib/format.js";
import { Avatar, NavBar } from "../components/ui.jsx";

export function MumsView({ cook, app }) {
  const people = app.mumsOf(cook);

  return (
    <>
      <NavBar onBack={app.back} title="Mums" />
      <div className="k-scroll k-mums-scroll">
        <div className="k-list">
          {people.map((uid) => {
            const user = USERS[uid];
            return (
              <button key={uid} className="k-row" onClick={() => app.open("user", uid)}>
                <Avatar user={user} size={44} />
                <span className="k-row-body">
                  <span className="k-row-t">{uid === "me" ? "Du" : first(user.name)}</span>
                  <span className="k-row-s">{uid === "me" ? user.name : user.bio}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
