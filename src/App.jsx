import { useState, useEffect, useMemo } from "react";
import { Home, Search, Plus, MessageCircle, User, Check, Settings } from "lucide-react";
import { STORAGE_KEY, PHOTO_KEY, PHOTO_MAX_CHARS, TILES, CUSTOM_TILE } from "./data/constants.js";
import { USERS, GRAPH } from "./data/users.js";
import { defaultData } from "./data/seed.js";
import { SEED_RECIPES } from "./data/recipes.js";
import { first } from "./lib/format.js";
import { evDate, buildNotifs } from "./lib/social.js";
import { PhotoCtx } from "./lib/photoContext.js";
import { FeedScreen } from "./screens/FeedScreen.jsx";
import { DiscoverScreen } from "./screens/DiscoverScreen.jsx";
import { MessagesScreen } from "./screens/MessagesScreen.jsx";
import { ProfileBody } from "./screens/ProfileBody.jsx";
import { RecipeView } from "./views/RecipeView.jsx";
import { CookView } from "./views/CookView.jsx";
import { NotifsView } from "./views/NotifsView.jsx";
import { FollowsView } from "./views/FollowsView.jsx";
import { UserView } from "./views/UserView.jsx";
import { MumsView } from "./views/MumsView.jsx";
import { ActionSheet } from "./sheets/ActionSheet.jsx";
import { LogSheet } from "./sheets/LogSheet.jsx";
import { NewRecipeSheet } from "./sheets/NewRecipeSheet.jsx";
import { ShareSheet } from "./sheets/ShareSheet.jsx";
import { ProfileSettingsSheet } from "./sheets/ProfileSettingsSheet.jsx";
import { AuthScreen } from "./screens/AuthScreen.jsx";
import { supabase } from "./lib/supabase.js";

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("feed");
  const [stack, setStack] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [photos, setPhotos] = useState({});
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [followRelations, setFollowRelations] = useState([]);
  const userId = session?.user?.id || "";
  const userStorageKey = userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
  const userPhotoKey = userId ? `${PHOTO_KEY}:${userId}` : PHOTO_KEY;

  useEffect(() => {
    if (!supabase) {
      setAuthLoaded(true);
      return undefined;
    }
    let active = true;
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!active) return;
      setSession(currentSession);
      if (currentSession) {
        setTab("feed");
        setStack([]);
        setSheet(null);
      }
      setAuthLoaded(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(nextSession);
      if (nextSession) {
        setTab("feed");
        setStack([]);
        setSheet(null);
      }
      setAuthLoaded(true);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Ladda sparad data
  useEffect(() => {
    if (!userId) {
      setLoaded(false);
      setPhotosLoaded(false);
      return undefined;
    }
    setLoaded(false);
    setPhotosLoaded(false);
    setData(defaultData());
    setPhotos({});
    setFollowRelations([]);
    (async () => {
      try {
        const res = await window.storage.get(userStorageKey, false);
        if (res && res.value) setData({ ...defaultData(), ...JSON.parse(res.value) });
        else {
          const emailName = session.user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
          const displayName = session.user.user_metadata?.full_name || emailName || USERS.me.name;
          setData((current) => ({ ...current, profile: { ...current.profile, name: displayName } }));
        }
      } catch (e) {
        // Ingen sparad data än
        const emailName = session.user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
        const displayName = session.user.user_metadata?.full_name || emailName || USERS.me.name;
        setData((current) => ({ ...current, profile: { ...current.profile, name: displayName } }));
      }
      setLoaded(true);
      try {
        const res = await window.storage.get(userPhotoKey, false);
        if (res && res.value) setPhotos(JSON.parse(res.value));
      } catch (e) {
        // Inga foton än
      }
      setPhotosLoaded(true);
    })();
  }, [userId, userStorageKey, userPhotoKey, session]);

  useEffect(() => {
    if (!userId || !supabase) {
      setProfilesLoaded(!userId);
      return undefined;
    }
    let active = true;
    (async () => {
      const { data: profileRows, error } = await supabase.from("profiles").select("id,name,bio,location,photo_url");
      if (!active) return;
      if (error) {
        console.error("Kunde inte läsa profiler:", error);
        setProfilesLoaded(true);
        return;
      }
      profileRows.forEach((profile) => {
        if (profile.id !== userId) {
          USERS[profile.id] = { id: profile.id, name: profile.name || "Köksvän", bio: profile.bio || "", location: profile.location || "", photo: profile.photo_url || null, color: "#6D8CA5", fg: "#fff" };
        }
      });
      const currentProfile = profileRows.find((profile) => profile.id === userId);
      const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() || USERS.me.name;
      const ownProfile = currentProfile || { id: userId, name: fallbackName, bio: "", location: "", photo_url: null };
      USERS.me = { ...USERS.me, name: ownProfile.name || fallbackName, bio: ownProfile.bio || "" };
      setData((current) => ({
        ...current,
        profile: {
          ...(current.profile || {}),
          name: ownProfile.name || fallbackName,
          bio: ownProfile.bio || "",
          location: ownProfile.location || "",
        },
      }));
      if (ownProfile.photo_url) {
        setPhotos((current) => ({ ...current, "profile:me": ownProfile.photo_url }));
      }
      if (!currentProfile) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: userId, name: fallbackName, bio: "", location: "", photo_url: null,
        });
        if (insertError) console.error("Kunde inte skapa profil:", insertError);
      }
      const { data: follows, error: followsError } = await supabase.from("follows").select("follower_id,following_id");
      if (!followsError && follows) {
        setFollowRelations(follows);
        setData((current) => ({ ...current, following: follows.filter((row) => row.follower_id === userId).map((row) => row.following_id) }));
      }
      setProfilesLoaded(true);
    })();
    return () => { active = false; };
  }, [userId, session]);

  // Foton sparas separat så att huvuddatan förblir liten
  useEffect(() => {
    if (!photosLoaded) return;
    const t = setTimeout(async () => {
      const json = JSON.stringify(photos);
      if (json.length > PHOTO_MAX_CHARS) { showToast("Lagringen för foton är full"); return; }
      try { await window.storage.set(userPhotoKey, json, false); }
      catch (e) { showToast("Fotot kunde inte sparas"); }
    }, 300);
    return () => clearTimeout(t);
  }, [photos, photosLoaded, userPhotoKey, userId]);

  // Spara vid ändring
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      try { await window.storage.set(userStorageKey, JSON.stringify(data), false); }
      catch (e) { console.error("Kunde inte spara:", e); }
    }, 300);
    return () => clearTimeout(t);
  }, [data, loaded, userStorageKey, userId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (sheet) setSheet(null);
      else if (stack.length) setStack((s) => s.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, stack.length]);

  const friendCooks = useMemo(() => [], []);
  const allCooks = useMemo(() => [...friendCooks, ...data.myCooks], [friendCooks, data.myCooks]);
  const byUser = useMemo(() => {
    const m = {};
    allCooks.forEach((c) => { (m[c.userId] = m[c.userId] || []).push(c); });
    return m;
  }, [allCooks]);
  const recipes = useMemo(() => {
    const m = {};
    SEED_RECIPES.filter((r) => r.author === null).forEach((r) => { m[r.id] = r; });
    data.myRecipes.forEach((r) => { m[r.id] = r; });
    return m;
  }, [data.myRecipes]);

  const notifs = useMemo(() => buildNotifs(data.myCooks, data), [data.myCooks, data.seededAt]);
  const unread = notifs.filter((n) => n.date > data.notifSeen).length;

  const showToast = (text) => setToast({ text, k: Date.now() });

  const app = {
    data, recipes, allCooks, setSheet, photos, notifs, unread, profilesLoaded, currentUserId: userId,
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) showToast("Det gick inte att logga ut");
    },
    sendMessage: (userId, text, sharedRecipeId) => setData((d) => ({
      ...d,
      messages: {
        ...d.messages,
        [userId]: [
          ...(d.messages[userId] || []),
          { id: "msg-" + Date.now(), userId: "me", text, recipeId: sharedRecipeId, date: new Date().toISOString() },
        ],
      },
    })),
    updateProfile: (profile, photo) => {
      setData((d) => ({ ...d, profile: { ...(d.profile || {}), ...profile } }));
      USERS.me = { ...USERS.me, ...profile };
      if (supabase && userId) {
        supabase.from("profiles").upsert({
          id: userId, name: profile.name, bio: profile.bio || "", location: profile.location || "",
        }).then(({ error }) => { if (error) console.error("Kunde inte uppdatera profil:", error); });
      }
      setPhotos((p) => {
        const next = { ...p };
        if (photo) next["profile:me"] = photo;
        else delete next["profile:me"];
        return next;
      });
    },
    cooksOf: (id) => byUser[id] || [],
    cookedCount: (recipeId) => allCooks.filter((cook) => cook.recipeId === recipeId).length,
    followingOf: (id) => {
      const actualId = id === "me" ? userId : id;
      return followRelations.filter((row) => row.follower_id === actualId).map((row) => row.following_id);
    },
    followersOf: (id) => {
      const actualId = id === "me" ? userId : id;
      return followRelations.filter((row) => row.following_id === actualId).map((row) => row.follower_id);
    },
    mutualWith: (id) => data.following.filter((x) => x !== id && ((GRAPH[id] || []).includes(x) || (GRAPH[x] || []).includes(id))),
    recipeOf: (cook) => {
      if (!cook) return null;
      if (cook.custom) {
        return {
          id: cook.id, title: cook.custom.title, author: cook.userId,
          category: cook.custom.category || "Egen rätt", emoji: cook.custom.emoji || "🍽️", tile: CUSTOM_TILE,
          time: cook.custom.time || 30, makes: cook.custom.makes || "4 portioner",
          ingredients: cook.custom.ingredients, steps: cook.custom.steps || [], custom: true,
        };
      }
      const recipe = recipes[cook.recipeId] || null;
      return recipe && cook.steps ? { ...recipe, steps: cook.steps } : recipe;
    },
    mumsOf: (cook) => [...cook.mums, ...(data.mums[cook.id] ? ["me"] : [])],
    commentsOf: (cook) => [
      ...cook.comments.map((c, i) => ({ ...c, key: `${cook.id}-seed-${i}`, date: c.date || evDate(cook, 40 * (i + 1)) })),
      ...(data.comments[cook.id] || []).map((c, i) => ({ ...c, key: `${cook.id}-comment-${c.id || i}`, date: c.date || cook.date })),
    ],
    open: (type, id, extra) => {
      if (type === "user" && id === "me") { setStack([]); setTab("profile"); return; }
      setStack((s) => [...s, { ...extra, type, id, k: Date.now() }]);
    },
    openNotifs: () => {
      setStack((s) => [...s, { type: "notifs", seenBefore: data.notifSeen, k: Date.now() }]);
      setData((d) => ({ ...d, notifSeen: new Date().toISOString() }));
    },
    back: () => setStack((s) => s.slice(0, -1)),
    toggleMums: (cookId) => setData((d) => (
      d.mums[cookId]
        ? d
        : { ...d, mums: { ...d.mums, [cookId]: true } }
    )),
    addComment: (cookId, text) => setData((d) => ({
      ...d, comments: { ...d.comments, [cookId]: [...(d.comments[cookId] || []), { id: "comment-" + Date.now(), userId: "me", text, date: new Date().toISOString() }] },
    })),
    toggleCommentLike: (commentKey) => setData((d) => {
      const current = d.commentLikes?.[commentKey] || [];
      const liked = current.includes("me");
      return {
        ...d,
        commentLikes: {
          ...(d.commentLikes || {}),
          [commentKey]: liked ? current.filter((id) => id !== "me") : [...current, "me"],
        },
      };
    }),
    toggleSave: (id) => {
      const on = data.saved.includes(id);
      setData((d) => ({
        ...d,
        saved: on ? d.saved.filter((x) => x !== id) : [id, ...d.saved],
        recipeSaves: { ...d.recipeSaves, [id]: Math.max(0, (d.recipeSaves[id] || 0) + (on ? -1 : 1)) },
      }));
      showToast(on ? "Borttaget från Sparade" : "Sparat");
    },
    toggleFollow: (id) => {
      if (id === "me" || id === userId) return;
      const on = data.following.includes(id);
      setData((d) => ({ ...d, following: on ? d.following.filter((x) => x !== id) : [...d.following, id] }));
      setFollowRelations((relations) => on
        ? relations.filter((row) => !(row.follower_id === userId && row.following_id === id))
        : [...relations, { follower_id: userId, following_id: id }]);
      if (supabase && userId) {
        const request = on
          ? supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", id)
          : supabase.from("follows").insert({ follower_id: userId, following_id: id });
        request.then(({ error }) => { if (error) console.error("Kunde inte uppdatera följning:", error); });
      }
      if (!on && USERS[id]) showToast(`Du följer nu ${first(USERS[id].name)}`);
    },
    logCook: (recipeId, note, photo, mods, custom, steps) => {
      const c = { id: "me-" + Date.now(), userId: "me", recipeId, date: new Date().toISOString(), note, mums: [], mumsAt: {}, comments: [], mods: mods || null, custom: custom || null, steps: steps || null };
      if (photo) setPhotos((p) => ({ ...p, [c.id]: photo, ...(recipeId ? { [recipeId]: photo } : {}) }));
      setData((d) => ({ ...d, myCooks: [c, ...d.myCooks] }));
      setSheet(null); setStack([]); setTab("feed");
      showToast("Publicerat");
      const friend = data.following[0];
      if (friend) {
        setTimeout(() => {
          const at = new Date().toISOString();
          setData((d) => ({
            ...d,
            myCooks: d.myCooks.map((x) => (x.id === c.id ? { ...x, mums: [...x.mums, friend], mumsAt: { ...x.mumsAt, [friend]: at } } : x)),
          }));
          showToast(`😋 ${first(USERS[friend].name)} tyckte mums`);
        }, 4000);
      }
    },
    addRecipe: (r, photo) => {
      const id = "u" + Date.now();
      const rec = { ...r, id, author: "me", tile: TILES[data.myRecipes.length % TILES.length] };
      if (photo) setPhotos((p) => ({ ...p, [id]: photo }));
      setData((d) => ({ ...d, myRecipes: [rec, ...d.myRecipes], recipeSaves: { ...d.recipeSaves, [id]: 1 } }));
      setSheet(null);
      setStack((s) => [...s, { type: "recipe", id, k: Date.now() }]);
      showToast("Recept sparat");
    },
    removeRecipe: (id) => {
      const relatedCookIds = data.myCooks.filter((cook) => cook.recipeId === id).map((cook) => cook.id);
      setData((d) => {
        const recipeSaves = { ...d.recipeSaves };
        delete recipeSaves[id];
        return {
          ...d,
          myCooks: d.myCooks.filter((cook) => cook.recipeId !== id),
          myRecipes: d.myRecipes.filter((recipe) => recipe.id !== id),
          saved: d.saved.filter((savedId) => savedId !== id),
          recipeSaves,
        };
      });
      setPhotos((p) => {
        const next = { ...p };
        delete next[id];
        relatedCookIds.forEach((cookId) => delete next[cookId]);
        return next;
      });
      setStack((s) => s.slice(0, -1));
      showToast("Borttaget från Mina recept");
    },
    deleteCook: (cookId) => {
      setData((d) => {
        const derived = d.myRecipes.find((recipe) => recipe.sourceCookId === cookId);
        const recipeSaves = { ...d.recipeSaves };
        if (derived) delete recipeSaves[derived.id];
        return {
          ...d,
          myCooks: d.myCooks.filter((cook) => cook.id !== cookId),
          myRecipes: d.myRecipes.filter((recipe) => recipe.sourceCookId !== cookId),
          saved: derived ? d.saved.filter((savedId) => savedId !== derived.id) : d.saved,
          recipeSaves,
        };
      });
      setPhotos((p) => {
        const next = { ...p };
        delete next[cookId];
        const cook = data.myCooks.find((item) => item.id === cookId);
        if (cook?.recipeId && next[cook.recipeId] === p[cookId]) delete next[cook.recipeId];
        return next;
      });
      setStack((s) => s.slice(0, -1));
      showToast("Loggen är borttagen");
    },
    saveCookAsRecipe: (cook) => {
      const recipe = app.recipeOf(cook);
      if (!cook.custom || !recipe) return;
      if (data.myRecipes.some((savedRecipe) => savedRecipe.sourceCookId === cook.id)) {
        showToast("Receptet är redan sparat");
        return;
      }
      const id = "u" + Date.now();
      const rec = {
        id,
        sourceCookId: cook.id,
        title: recipe.title,
        author: "me",
        category: "Egen rätt",
        emoji: "🍽️",
        tile: TILES[data.myRecipes.length % TILES.length],
        time: 30,
        makes: "1 portion",
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      };
      if (photos[cook.id]) setPhotos((p) => ({ ...p, [id]: p[cook.id] }));
      setData((d) => ({ ...d, myRecipes: [rec, ...d.myRecipes], recipeSaves: { ...d.recipeSaves, [id]: 1 } }));
      showToast("Eget recept sparat");
    },
    share: (recipeId, ids) => {
      setData((d) => {
        const messages = { ...d.messages };
        ids.forEach((userId) => {
          messages[userId] = [
            ...(messages[userId] || []),
            { id: "msg-" + Date.now() + "-" + userId, userId: "me", text: "", recipeId, date: new Date().toISOString() },
          ];
        });
        return { ...d, messages };
      });
      setSheet(null);
      showToast(`Delat med ${ids.length === 1 ? first(USERS[ids[0]].name) : `${ids.length} vänner`}`);
    },
    reset: () => { setData(defaultData()); setPhotos({}); setStack([]); showToast("Demodata återställd"); },
  };

  const TABS = [
    ["feed", "Start", Home],
    ["discover", "Upptäck", Search],
    ["plus", "Skapa", Plus],
    ["messages", "Meddelanden", MessageCircle],
    ["profile", "Profil", User],
  ];

  if (!authLoaded || (session && (!loaded || !profilesLoaded))) {
    return <div className="k-root"><main className="k-auth-loading">Laddar Köket...</main></div>;
  }
  if (recovery) return <AuthScreen recovery onRecoveryComplete={async () => {
    setRecovery(false);
    await supabase.auth.signOut();
  }} />;
  if (!session) return <AuthScreen />;

  return (
    <PhotoCtx.Provider value={photos}>
    <div className="k-root">
      <div className="k-phone">
        <div className="k-status" aria-hidden="true"><span>9:41</span><span className="k-batt"><i /></span></div>
        <div className="k-body">
          <main key={tab} className={"k-scroll" + (tab === "feed" ? " grey" : "")}>
            {tab === "feed" && <FeedScreen app={app} />}
            {tab === "discover" && <DiscoverScreen app={app} />}
            {tab === "messages" && <MessagesScreen app={app} />}
            {tab === "profile" && (
              <>
                <header className="k-lt"><h1>Profil</h1><button className="k-nav-btn" onClick={() => setSheet({ type: "profile-settings" })} aria-label="Inställningar"><Settings size={22} /></button></header>
                <ProfileBody uid="me" app={app} />
              </>
            )}
          </main>

          <nav className="k-tabs" aria-label="Huvudmeny">
            {TABS.map(([id, label, Icon]) =>
              id === "plus" ? (
                <button key={id} className="k-tab" onClick={() => setSheet({ type: "action" })} aria-label="Skapa">
                  <span className="k-plus"><Plus size={24} strokeWidth={2.4} /></span>
                </button>
              ) : (
                <button key={id} className={"k-tab" + (tab === id ? " on" : "")} aria-current={tab === id ? "page" : undefined}
                  onClick={() => { setTab(id); setStack([]); }}>
                  <Icon size={25} strokeWidth={tab === id ? 2.3 : 1.8} />{label}
                </button>
              )
            )}
          </nav>

          {stack.map((v, i) => (
            <div key={v.k} className={"k-push" + (v.type === "mums" || v.type === "notifs" ? " k-push-glass" : "")} style={{ zIndex: 20 + i }}>
              {v.type === "recipe" && <RecipeView id={v.id} app={app} />}
              {v.type === "user" && <UserView id={v.id} app={app} />}
              {v.type === "cook" && <CookView id={v.id} app={app} focus={!!v.focus} />}
              {v.type === "notifs" && <NotifsView app={app} seenBefore={v.seenBefore} />}
              {v.type === "mums" && <MumsView cook={allCooks.find((c) => c.id === v.id)} app={app} />}
              {v.type === "follows" && <FollowsView uid={v.id} tab={v.tab} app={app} />}
            </div>
          ))}

          {sheet?.type === "action" && <ActionSheet app={app} onClose={() => setSheet(null)} />}
          {sheet?.type === "log" && <LogSheet app={app} initial={sheet.recipeId} onClose={() => setSheet(null)} />}
          {sheet?.type === "new" && <NewRecipeSheet app={app} onClose={() => setSheet(null)} />}
          {sheet?.type === "share" && <ShareSheet app={app} recipeId={sheet.recipeId} onClose={() => setSheet(null)} />}
          {sheet?.type === "profile-settings" && <ProfileSettingsSheet app={app} onClose={() => setSheet(null)} />}

          {toast && <div key={toast.k} className="k-toast" role="status"><Check size={16} strokeWidth={3} />{toast.text}</div>}
        </div>
        <div className="k-homebar" />
      </div>
    </div>
    </PhotoCtx.Provider>
  );
}
