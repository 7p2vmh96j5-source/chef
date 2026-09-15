import { useState, useEffect, useMemo, useRef } from "react";
import { Home, GraduationCap, Plus, MessageCircle, User, Check, Settings } from "lucide-react";
import { STORAGE_KEY, PHOTO_KEY, PHOTO_MAX_CHARS, TILES, CUSTOM_TILE } from "./data/constants.js";
import { USERS, GRAPH } from "./data/users.js";
import { Avatar } from "./components/ui.jsx";
import { defaultData } from "./data/seed.js";
import { SEED_RECIPES } from "./data/recipes.js";
import { first } from "./lib/format.js";
import { photoList } from "./lib/photos.js";
import { xpForRecipe, unlockedGuideIds } from "./lib/xp.js";
import { evDate, buildNotifs } from "./lib/social.js";
import { PhotoCtx } from "./lib/photoContext.js";
import { FeedScreen } from "./screens/FeedScreen.jsx";
import { GuideScreen } from "./screens/GuideScreen.jsx";
import { MessagesScreen } from "./screens/MessagesScreen.jsx";
import { ProfileBody } from "./screens/ProfileBody.jsx";
import { RecipeView } from "./views/RecipeView.jsx";
import { CookView } from "./views/CookView.jsx";
import { NotifsView } from "./views/NotifsView.jsx";
import { FollowsView } from "./views/FollowsView.jsx";
import { FolderView } from "./views/FolderView.jsx";
import { RestaurantFolderView } from "./views/RestaurantFolderView.jsx";
import { UserView } from "./views/UserView.jsx";
import { MumsView } from "./views/MumsView.jsx";
import { ActionSheet } from "./sheets/ActionSheet.jsx";
import { LogSheet } from "./sheets/LogSheet.jsx";
import { NewRecipeSheet } from "./sheets/NewRecipeSheet.jsx";
import { ShareSheet } from "./sheets/ShareSheet.jsx";
import { ProfileSettingsSheet } from "./sheets/ProfileSettingsSheet.jsx";
import { EditProfileSheet } from "./sheets/EditProfileSheet.jsx";
import { SaveRecipeSheet } from "./sheets/SaveRecipeSheet.jsx";
import { MyFoldersSheet } from "./sheets/MyFoldersSheet.jsx";
import { MyRestaurantFoldersSheet } from "./sheets/MyRestaurantFoldersSheet.jsx";
import { SimplePostSheet } from "./sheets/SimplePostSheet.jsx";
import { ChefTitlesSheet } from "./sheets/ChefTitlesSheet.jsx";
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
  const [sharedLoaded, setSharedLoaded] = useState(false);
  const [followRelations, setFollowRelations] = useState([]);
  const deletedRecipeIds = useRef(new Set());
  const deletedCookIds = useRef(new Set());
  const loadSharedRef = useRef(null);
  const unsavingRecipeIds = useRef(new Set());
  const pendingCommentLikes = useRef(new Map());
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
    setSharedLoaded(false);
    setData(defaultData());
    setPhotos({});
    setFollowRelations([]);
    (async () => {
      try {
        const res = await window.storage.get(userStorageKey, false);
        if (res && res.value) {
          const localData = JSON.parse(res.value);
          setData((current) => ({
            ...defaultData(),
            ...localData,
            sharedRecipes: current.sharedRecipes,
            sharedCooks: current.sharedCooks,
          }));
        }
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
      let { data: profileRows, error } = await supabase.from("profiles").select("id,name,bio,location,photo_url,birth_date,xp,dark_mode");
      if (error) {
        // Om birth_date/xp/dark_mode-kolumnerna inte finns än i databasen, försök utan dem istället för att låta hela laddningen (följningar m.m.) misslyckas.
        console.error("Kunde inte läsa profiler (med födelsedatum/xp/mörkt läge), försöker utan:", error);
        const fallback = await supabase.from("profiles").select("id,name,bio,location,photo_url");
        profileRows = fallback.data ? fallback.data.map((p) => ({ ...p, birth_date: null, xp: 0, dark_mode: null })) : null;
        error = fallback.error;
      }
      if (!active) return;
      if (error || !profileRows) {
        console.error("Kunde inte läsa profiler:", error);
      } else {
        profileRows.forEach((profile) => {
          if (profile.id !== userId) {
            USERS[profile.id] = { id: profile.id, name: profile.name || "Köksvän", bio: profile.bio || "", location: profile.location || "", photo: profile.photo_url || null, color: "#000000", fg: "#fff", xp: profile.xp || 0 };
          }
        });
        const currentProfile = profileRows.find((profile) => profile.id === userId);
        const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() || USERS.me.name;
        const ownProfile = currentProfile || { id: userId, name: fallbackName, bio: "", location: "", photo_url: null, birth_date: null, xp: 0, dark_mode: null };
        USERS.me = { ...USERS.me, name: ownProfile.name || fallbackName, bio: ownProfile.bio || "", xp: ownProfile.xp || 0 };
        setData((current) => ({
          ...current,
          xp: ownProfile.xp || current.xp || 0,
          darkMode: ownProfile.dark_mode ?? current.darkMode,
          profile: {
            ...(current.profile || {}),
            name: ownProfile.name || fallbackName,
            bio: ownProfile.bio || "",
            location: ownProfile.location || "",
            birthDate: ownProfile.birth_date || "",
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
      }
      // Hämtas oberoende av om profilerna kunde läsas, så att ett fel ovan inte tar bort följningar också.
      const { data: follows, error: followsError } = await supabase.from("follows").select("follower_id,following_id");
      if (followsError) {
        console.error("Kunde inte läsa följningar:", followsError);
      } else if (follows) {
        setFollowRelations(follows);
        setData((current) => ({ ...current, following: follows.filter((row) => row.follower_id === userId).map((row) => row.following_id) }));
      }
      setProfilesLoaded(true);
    })();
    return () => { active = false; };
  }, [userId, session]);

  useEffect(() => {
    if (!userId || !supabase) return undefined;
    let active = true;
    supabase.from("messages")
      .select("id,sender_id,receiver_id,text,recipe_id,created_at")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: true })
      .then(({ data: rows, error }) => {
        if (!active) return;
        if (error) {
          console.error("Kunde inte läsa meddelanden:", error);
          return;
        }
        const messages = {};
        rows.forEach((row) => {
          const otherId = row.sender_id === userId ? row.receiver_id : row.sender_id;
          (messages[otherId] ||= []).push({
            id: row.id,
            userId: row.sender_id === userId ? "me" : row.sender_id,
            text: row.text || "",
            recipeId: row.recipe_id,
            date: row.created_at,
          });
        });
        setData((current) => ({ ...current, messages }));
      });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId || !supabase || !loaded || !sharedLoaded) return undefined;
    let active = true;
    (async () => {
      const results = await Promise.all([
        ...data.myRecipes.map((recipe) => {
          const list = photoList(photos[recipe.id]);
          return upsertWithPhotosFallback("recipes", {
            id: recipe.id, author_id: userId, data: recipe, photo: list[0] || null, photos: list.length ? list : null,
          });
        }),
        ...data.myCooks.map((cook) => {
          const list = photoList(photos[cook.id]);
          return upsertWithPhotosFallback("cooks", {
            id: cook.id, user_id: userId, recipe_id: cook.recipeId || null, data: cook, photo: list[0] || null, photos: list.length ? list : null,
          });
        }),
      ]);
      if (active && results.some(({ error }) => error)) {
        console.error("Kunde inte synkronisera lokala recept eller inlägg:", results
          .filter(({ error }) => error)
          .map(({ error }) => error));
      }
    })();
    return () => { active = false; };
  }, [userId, loaded, sharedLoaded, data.myRecipes, data.myCooks]);

  useEffect(() => {
    if (!userId || !supabase) {
      setSharedLoaded(!userId);
      return undefined;
    }
    let active = true;
    // Om photos-kolumnen inte finns än i databasen, försök utan den istället för att låta hela synken misslyckas.
    const selectWithPhotosFallback = async (table, columns, fallbackColumns) => {
      let { data, error } = await supabase.from(table).select(columns).order("created_at", { ascending: false });
      if (error) {
        console.error(`Kunde inte läsa ${table} (med photos), försöker utan:`, error);
        const fallback = await supabase.from(table).select(fallbackColumns).order("created_at", { ascending: false });
        data = fallback.data ? fallback.data.map((row) => ({ ...row, photos: null })) : null;
        error = fallback.error;
      }
      return { data, error };
    };
    const selectSavesWithFallback = async () => {
      let { data, error } = await supabase.from("saves").select("recipe_id,user_id,folder_id,saved_from,created_at");
      if (error) {
        console.error("Kunde inte läsa sparade recept (med mapp/källa), försöker utan:", error);
        const fallback = await supabase.from("saves").select("recipe_id,user_id,created_at");
        data = fallback.data ? fallback.data.map((row) => ({ ...row, folder_id: null, saved_from: null })) : null;
        error = fallback.error;
      }
      return { data, error };
    };
    const selectIgnoringMissingTable = async (table, columns) => {
      const { data, error } = await supabase.from(table).select(columns);
      if (error) console.error(`Kunde inte läsa ${table} (synkas lokalt tills tabellen finns):`, error);
      return { data: data || [], error };
    };
    const loadShared = async () => {
      const [recipesResult, cooksResult, commentsResult, mumsResult, savesResult, recipeFoldersResult, restaurantFoldersResult, userStateResult, commentLikesResult] = await Promise.all([
        selectWithPhotosFallback("recipes", "id,author_id,data,photo,photos,created_at", "id,author_id,data,photo,created_at"),
        selectWithPhotosFallback("cooks", "id,user_id,recipe_id,data,photo,photos,folder_id,created_at", "id,user_id,recipe_id,data,photo,created_at"),
        supabase.from("comments").select("id,cook_id,user_id,text,created_at").order("created_at", { ascending: true }),
        supabase.from("mums").select("cook_id,user_id,created_at"),
        selectSavesWithFallback(),
        selectIgnoringMissingTable("recipe_folders", "id,name"),
        selectIgnoringMissingTable("restaurant_folders", "id,name"),
        selectIgnoringMissingTable("user_state", "notif_seen,messages_seen"),
        selectIgnoringMissingTable("comment_likes", "comment_id,user_id"),
      ]);
      if (!active) return;
      if (recipesResult.error) console.error("Kunde inte läsa gemensamma recept:", recipesResult.error);
      if (cooksResult.error) console.error("Kunde inte läsa gemensamma inlägg:", cooksResult.error);
      if (commentsResult.error) console.error("Kunde inte läsa kommentarer:", commentsResult.error);
      if (mumsResult.error) console.error("Kunde inte läsa mums:", mumsResult.error);
      if (savesResult.error) console.error("Kunde inte läsa sparade recept:", savesResult.error);
      // Filtrera bort sådant som just tagits bort lokalt men ännu inte hunnit försvinna från Supabase,
      // så att en pågående borttagning inte dyker upp igen vid nästa synk.
      const recipeRows = (recipesResult.data || []).filter((row) => !deletedRecipeIds.current.has(row.id));
      const cookRows = (cooksResult.data || []).filter((row) => !deletedCookIds.current.has(row.id));
      const saveRows = (savesResult.data || []).filter((row) =>
        !deletedRecipeIds.current.has(row.recipe_id) && !(row.user_id === userId && unsavingRecipeIds.current.has(row.recipe_id)));
      const sharedComments = {};
      (commentsResult.data || []).filter((row) => row.user_id !== userId).forEach((row) => {
        (sharedComments[row.cook_id] ||= []).push({ id: row.id, userId: row.user_id, text: row.text, date: row.created_at });
      });
      const sharedMums = {};
      (mumsResult.data || []).filter((row) => row.user_id !== userId).forEach((row) => {
        (sharedMums[row.cook_id] ||= []).push({ userId: row.user_id, date: row.created_at });
      });
      const sharedSaves = {};
      saveRows.filter((row) => row.user_id !== userId).forEach((row) => {
        (sharedSaves[row.recipe_id] ||= []).push({ userId: row.user_id, date: row.created_at });
      });
      // Ägda av mig, hämtade från Supabase så att sparat/mums/mappar inte försvinner på en ny enhet.
      const myMums = {};
      (mumsResult.data || []).filter((row) => row.user_id === userId).forEach((row) => { myMums[row.cook_id] = true; });
      const mySaveRows = saveRows.filter((row) => row.user_id === userId);
      const recipeFolderOf = {};
      const recipeSavedFrom = {};
      const recipeSavedAt = {};
      mySaveRows.forEach((row) => {
        if (row.folder_id) recipeFolderOf[row.recipe_id] = row.folder_id;
        if (row.saved_from) recipeSavedFrom[row.recipe_id] = row.saved_from;
        if (row.created_at) recipeSavedAt[row.recipe_id] = row.created_at;
      });
      const recipeSaves = {};
      saveRows.forEach((row) => { recipeSaves[row.recipe_id] = (recipeSaves[row.recipe_id] || 0) + 1; });
      const restaurantFolderOf = {};
      cookRows.filter((row) => row.user_id === userId && row.folder_id).forEach((row) => { restaurantFolderOf[row.id] = row.folder_id; });
      const remoteState = (userStateResult.data || [])[0];
      // Alla gillningar (egna och andras), med lokalt pågående ändringar som vinner tills de bekräftats.
      const commentLikes = {};
      (commentLikesResult.data || []).forEach((row) => {
        (commentLikes[row.comment_id] ||= []).push(row.user_id);
      });
      pendingCommentLikes.current.forEach((liked, key) => {
        const likers = new Set(commentLikes[key] || []);
        if (liked) likers.add(userId); else likers.delete(userId);
        commentLikes[key] = [...likers];
      });
      // Egna kommentarer läggs till om de saknas lokalt, samma mönster som myCooks/myRecipes,
      // så en egen kommentar syns igen på en ny enhet.
      const myCommentRows = (commentsResult.data || []).filter((row) => row.user_id === userId);
      setData((current) => {
        const myCooksById = new Map(current.myCooks.map((c) => [c.id, c]));
        cookRows.filter((row) => row.user_id === userId).forEach((row) => {
          if (!myCooksById.has(row.id)) myCooksById.set(row.id, { ...row.data, id: row.id });
        });
        const myRecipesById = new Map(current.myRecipes.map((r) => [r.id, r]));
        recipeRows.filter((row) => row.author_id === userId).forEach((row) => {
          if (!myRecipesById.has(row.id)) myRecipesById.set(row.id, { ...row.data, id: row.id, author: "me" });
        });
        const comments = { ...current.comments };
        myCommentRows.forEach((row) => {
          const list = comments[row.cook_id] || [];
          if (!list.some((c) => c.id === row.id)) {
            comments[row.cook_id] = [...list, { id: row.id, userId: "me", text: row.text, date: row.created_at }];
          }
        });
        return {
          ...current,
          myCooks: [...myCooksById.values()].sort((a, b) => b.date.localeCompare(a.date)),
          myRecipes: [...myRecipesById.values()],
          comments,
          commentLikes: commentLikesResult.error ? current.commentLikes : commentLikes,
          sharedRecipes: recipeRows.map((row) => ({
            ...row.data, id: row.id, author: row.author_id === userId ? "me" : row.author_id,
          })),
          sharedCooks: cookRows.filter((row) => row.user_id !== userId).map((row) => ({
            ...row.data, id: row.id, userId: row.user_id, recipeId: row.recipe_id, date: row.created_at,
          })),
          sharedComments,
          sharedMums,
          sharedSaves,
          mums: { ...current.mums, ...myMums },
          // Endast ersätt dessa om respektive hämtning faktiskt lyckades - annars kan ett tillfälligt
          // nätverksfel eller en saknad kolumn/tabell tömma redan kända sparade recept/mappar lokalt.
          saved: savesResult.error ? current.saved : mySaveRows.map((row) => row.recipe_id),
          recipeSavedAt: savesResult.error ? current.recipeSavedAt : recipeSavedAt,
          recipeFolderOf: savesResult.error ? current.recipeFolderOf : recipeFolderOf,
          recipeSavedFrom: savesResult.error ? current.recipeSavedFrom : recipeSavedFrom,
          recipeSaves: savesResult.error ? current.recipeSaves : recipeSaves,
          restaurantFolderOf: cooksResult.error ? current.restaurantFolderOf : restaurantFolderOf,
          recipeFolders: recipeFoldersResult.error ? current.recipeFolders : recipeFoldersResult.data,
          restaurantFolders: restaurantFoldersResult.error ? current.restaurantFolders : restaurantFoldersResult.data,
          notifSeen: remoteState?.notif_seen && remoteState.notif_seen > current.notifSeen ? remoteState.notif_seen : current.notifSeen,
          messagesSeen: remoteState?.messages_seen && remoteState.messages_seen > current.messagesSeen ? remoteState.messages_seen : current.messagesSeen,
        };
      });
      setPhotos((current) => {
        const next = { ...current };
        recipeRows.forEach((row) => {
          const list = row.photos && row.photos.length ? row.photos : photoList(row.photo);
          if (list.length) next[row.id] = list;
        });
        cookRows.forEach((row) => {
          const list = row.photos && row.photos.length ? row.photos : photoList(row.photo);
          if (list.length) {
            next[row.id] = list;
            if (row.recipe_id) next[row.recipe_id] = list;
          }
        });
        return next;
      });
      setSharedLoaded(true);
    };
    loadSharedRef.current = loadShared;
    loadShared();
    const onVisible = () => { if (document.visibilityState === "visible") loadShared(); };
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(loadShared, 20000);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [userId]);

  // Foton sparas separat så att huvuddatan förblir liten.
  // Bara egna foton cachas lokalt - allas foton hämtas ändå på nytt från Supabase, som är källan till sanning.
  useEffect(() => {
    if (!photosLoaded) return;
    const t = setTimeout(async () => {
      const ownIds = new Set(["profile:me", ...data.myRecipes.map((r) => r.id), ...data.myCooks.map((c) => c.id)]);
      const ownPhotos = {};
      ownIds.forEach((id) => { if (photos[id]) ownPhotos[id] = photos[id]; });
      const json = JSON.stringify(ownPhotos);
      if (json.length > PHOTO_MAX_CHARS) { showToast("Lagringen för foton är full"); return; }
      try { await window.storage.set(userPhotoKey, json, false); }
      catch (e) { showToast("Fotot kunde inte sparas"); }
    }, 300);
    return () => clearTimeout(t);
  }, [photos, photosLoaded, userPhotoKey, userId, data.myRecipes, data.myCooks]);

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
  const allCooks = useMemo(() => [...friendCooks, ...data.sharedCooks, ...data.myCooks], [friendCooks, data.sharedCooks, data.myCooks]);
  const byUser = useMemo(() => {
    const m = {};
    allCooks.forEach((c) => { (m[c.userId] = m[c.userId] || []).push(c); });
    return m;
  }, [allCooks]);
  const recipes = useMemo(() => {
    const m = {};
    SEED_RECIPES.filter((r) => r.author === null).forEach((r) => { m[r.id] = r; });
    data.sharedRecipes.forEach((r) => { m[r.id] = r; });
    data.myRecipes.forEach((r) => { m[r.id] = r; });
    return m;
  }, [data.myRecipes, data.sharedRecipes]);

  const myRecipesList = useMemo(() => [...new Map([
    ...data.myRecipes,
    ...Object.values(recipes).filter((r) => r.author === "me"),
    ...data.saved.map((id) => recipes[id]).filter(Boolean),
  ].map((recipe) => [recipe.id, recipe])).values()]
    .sort((a, b) => {
      const savedAt = data.recipeSavedAt || {};
      const aTime = savedAt[a.id] || a.created_at || "";
      const bTime = savedAt[b.id] || b.created_at || "";
      return bTime.localeCompare(aTime) || String(b.id).localeCompare(String(a.id));
    }), [data.myRecipes, recipes, data.saved, data.recipeSavedAt]);

  const notifs = useMemo(() => buildNotifs(data.myCooks, data), [
    data.myCooks, data.myRecipes, data.sharedCooks, data.sharedMums, data.sharedComments, data.sharedSaves, data.seededAt,
  ]);
  const unread = notifs.filter((n) => n.date > data.notifSeen).length;
  const unreadMessages = useMemo(() => Object.values(data.messages)
    .flat()
    .filter((m) => m.userId !== "me" && m.date > data.messagesSeen).length,
  [data.messages, data.messagesSeen]);

  const showToast = (text) => setToast({ text, k: Date.now() });

  // Om photos-kolumnen inte finns än i databasen, försök utan den istället för att låta hela sparningen misslyckas.
  const upsertWithPhotosFallback = async (table, payload, onConflict = "id") => {
    const result = await supabase.from(table).upsert(payload, { onConflict });
    if (result.error) {
      const msg = result.error.message || "";
      const rest = { ...payload };
      let changed = false;
      if (/photos/i.test(msg) && "photos" in rest) { delete rest.photos; changed = true; }
      if (/folder_id/i.test(msg) && "folder_id" in rest) { delete rest.folder_id; changed = true; }
      if (changed) return supabase.from(table).upsert(rest, { onConflict });
    }
    return result;
  };

  // Om folder_id/saved_from-kolumnerna inte finns än i databasen, försök utan dem istället för
  // att låta hela sparningen misslyckas.
  const upsertSaveWithFallback = async (payload) => {
    const result = await supabase.from("saves").upsert(payload, { onConflict: "recipe_id,user_id" });
    if (result.error) {
      const msg = result.error.message || "";
      const rest = { ...payload };
      let changed = false;
      if (/folder_id/i.test(msg) && "folder_id" in rest) { delete rest.folder_id; changed = true; }
      if (/saved_from/i.test(msg) && "saved_from" in rest) { delete rest.saved_from; changed = true; }
      if (changed) return supabase.from("saves").upsert(rest, { onConflict: "recipe_id,user_id" });
    }
    return result;
  };

  const syncUserState = (patch) => {
    if (!supabase || !userId) return;
    supabase.from("user_state").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
      .then(({ error }) => { if (error) console.error("Kunde inte synka läst-status (finns tabellen user_state?):", error); });
  };

  const app = {
    data, recipes, allCooks, myRecipesList, setSheet, photos, notifs, unread, unreadMessages, profilesLoaded, currentUserId: userId,
    refreshShared: () => (loadSharedRef.current ? loadSharedRef.current() : Promise.resolve()),
    showToast,
    toggleDarkMode: () => {
      const next = !data.darkMode;
      setData((d) => ({ ...d, darkMode: next }));
      if (supabase && userId) {
        supabase.from("profiles").update({ dark_mode: next }).eq("id", userId)
          .then(({ error }) => { if (error) console.error("Kunde inte synka mörkt läge (finns kolumnen dark_mode?):", error); });
      }
    },
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) showToast("Det gick inte att logga ut");
    },
    sendMessage: (receiverId, text, sharedRecipeId) => {
      const localMessage = { id: "local-" + Date.now(), userId: "me", text, recipeId: sharedRecipeId, date: new Date().toISOString() };
      setData((d) => ({
        ...d,
        messages: { ...d.messages, [receiverId]: [...(d.messages[receiverId] || []), localMessage] },
      }));
      if (supabase && userId) {
        supabase.from("messages").insert({
          sender_id: userId, receiver_id: receiverId, text, recipe_id: sharedRecipeId || null,
        }).then(({ error }) => {
          if (error) console.error("Kunde inte skicka meddelande:", error);
        });
      }
    },
    updateProfile: (profile, photo) => {
      const merged = { ...(data.profile || {}), ...profile };
      setData((d) => ({ ...d, profile: { ...(d.profile || {}), ...profile } }));
      USERS.me = { ...USERS.me, ...profile };
      setPhotos((p) => {
        const next = { ...p };
        if (photo) next["profile:me"] = photo;
        else delete next["profile:me"];
        return next;
      });
      if (supabase && userId) {
        supabase.from("profiles").upsert({
          id: userId, name: merged.name, bio: merged.bio || "", location: merged.location || "",
          birth_date: merged.birthDate || null, photo_url: photo || null,
        }).then(({ error }) => { if (error) console.error("Kunde inte uppdatera profil:", error); });
      }
    },
    cooksOf: (id) => byUser[id] || [],
    cookedCount: (recipeId) => allCooks.filter((cook) => cook.recipeId === recipeId).length,
    savedOf: (id) => {
      if (id === "me") return data.saved.map((rid) => recipes[rid]).filter(Boolean);
      const savedAt = {};
      Object.entries(data.sharedSaves).forEach(([rid, savers]) => {
        const entry = savers.find((s) => s.userId === id);
        if (entry) savedAt[rid] = entry.date;
      });
      return Object.keys(savedAt)
        .map((rid) => recipes[rid])
        .filter(Boolean)
        .sort((a, b) => savedAt[b.id].localeCompare(savedAt[a.id]));
    },
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
    mumsOf: (cook) => [
      ...cook.mums,
      ...(data.mums[cook.id] ? ["me"] : []),
      ...(data.sharedMums[cook.id] || []).map((m) => m.userId),
    ],
    commentsOf: (cook) => {
      // Samma nyckelformat oavsett om kommentaren kommer från min egen lokala cache eller
      // andras (synkade), så att t.ex. gillningar pekar på samma kommentar för alla.
      const byKey = new Map();
      cook.comments.forEach((c, i) => {
        const key = `${cook.id}-seed-${i}`;
        byKey.set(key, { ...c, key, date: c.date || evDate(cook, 40 * (i + 1)) });
      });
      (data.comments[cook.id] || []).forEach((c, i) => {
        const key = `${cook.id}-comment-${c.id || i}`;
        byKey.set(key, { ...c, key, date: c.date || cook.date });
      });
      (data.sharedComments[cook.id] || []).forEach((c) => {
        const key = `${cook.id}-comment-${c.id}`;
        if (!byKey.has(key)) byKey.set(key, { ...c, key });
      });
      return [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date));
    },
    open: (type, id, extra) => {
      if (type === "user" && id === "me") { setStack([]); setTab("profile"); return; }
      setStack((s) => [...s, { ...extra, type, id, k: Date.now() }]);
    },
    openNotifs: () => {
      setStack((s) => [...s, { type: "notifs", seenBefore: data.notifSeen, k: Date.now() }]);
      const seenAt = new Date().toISOString();
      setData((d) => ({ ...d, notifSeen: seenAt }));
      syncUserState({ notif_seen: seenAt });
    },
    back: () => setStack((s) => s.slice(0, -1)),
    toggleMums: (cookId) => {
      if (data.mums[cookId]) return;
      setData((d) => ({ ...d, mums: { ...d.mums, [cookId]: true } }));
      if (supabase && userId) {
        supabase.from("mums").upsert({ cook_id: cookId, user_id: userId }, { onConflict: "cook_id,user_id" })
          .then(({ error }) => { if (error) console.error("Kunde inte spara mums:", error); });
      }
    },
    addComment: (cookId, text) => {
      const id = "c" + Date.now();
      setData((d) => ({
        ...d, comments: { ...d.comments, [cookId]: [...(d.comments[cookId] || []), { id, userId: "me", text, date: new Date().toISOString() }] },
      }));
      if (supabase && userId) {
        supabase.from("comments").insert({ id, cook_id: cookId, user_id: userId, text })
          .then(({ error }) => { if (error) console.error("Kunde inte spara kommentar:", error); });
      }
    },
    toggleCommentLike: (commentKey) => {
      const current = data.commentLikes?.[commentKey] || [];
      const liked = userId ? current.includes(userId) : current.includes("me");
      setData((d) => {
        const list = d.commentLikes?.[commentKey] || [];
        return {
          ...d,
          commentLikes: {
            ...(d.commentLikes || {}),
            [commentKey]: liked ? list.filter((x) => x !== userId && x !== "me") : [...list, userId || "me"],
          },
        };
      });
      if (supabase && userId) {
        pendingCommentLikes.current.set(commentKey, !liked);
        const request = liked
          ? supabase.from("comment_likes").delete().eq("comment_id", commentKey).eq("user_id", userId)
          : supabase.from("comment_likes").upsert({ comment_id: commentKey, user_id: userId }, { onConflict: "comment_id,user_id" });
        request.then(({ error }) => {
          if (error) console.error("Kunde inte synka gillning (finns tabellen comment_likes?):", error);
          pendingCommentLikes.current.delete(commentKey);
        });
      }
    },
    toggleSave: (id) => {
      const on = data.saved.includes(id);
      setData((d) => {
        const recipeFolderOf = { ...(d.recipeFolderOf || {}) };
        const recipeSavedFrom = { ...(d.recipeSavedFrom || {}) };
        if (on) { delete recipeFolderOf[id]; delete recipeSavedFrom[id]; }
        return {
          ...d,
          saved: on ? d.saved.filter((x) => x !== id) : [id, ...d.saved],
          recipeSavedAt: on
            ? d.recipeSavedAt
            : { ...(d.recipeSavedAt || {}), [id]: new Date().toISOString() },
          recipeSaves: { ...d.recipeSaves, [id]: Math.max(0, (d.recipeSaves[id] || 0) + (on ? -1 : 1)) },
          recipeFolderOf,
          recipeSavedFrom,
        };
      });
      showToast(on ? "Borttaget från Sparade" : "Sparat");
      if (supabase && userId) {
        if (on) {
          unsavingRecipeIds.current.add(id);
          supabase.from("saves").delete().eq("recipe_id", id).eq("user_id", userId)
            .then(({ error }) => {
              if (error) console.error("Kunde inte synka sparat recept:", error);
              unsavingRecipeIds.current.delete(id);
            });
        } else {
          supabase.from("saves").upsert({ recipe_id: id, user_id: userId }, { onConflict: "recipe_id,user_id" })
            .then(({ error }) => { if (error) console.error("Kunde inte synka sparat recept:", error); });
        }
      }
    },
    saveRecipeToFolder: (id, folderId, fromUserId) => {
      const on = data.saved.includes(id);
      setData((d) => ({
        ...d,
        saved: on ? d.saved : [id, ...d.saved],
        recipeSavedAt: on ? d.recipeSavedAt : { ...(d.recipeSavedAt || {}), [id]: new Date().toISOString() },
        recipeSaves: on ? d.recipeSaves : { ...d.recipeSaves, [id]: (d.recipeSaves[id] || 0) + 1 },
        recipeFolderOf: { ...(d.recipeFolderOf || {}), [id]: folderId || null },
        recipeSavedFrom: fromUserId ? { ...(d.recipeSavedFrom || {}), [id]: fromUserId } : (d.recipeSavedFrom || {}),
      }));
      const folderName = folderId ? data.recipeFolders.find((f) => f.id === folderId)?.name : null;
      showToast(folderName ? `Sparat i ${folderName}` : "Sparat");
      setSheet(null);
      if (supabase && userId) {
        upsertSaveWithFallback({
          recipe_id: id, user_id: userId, folder_id: folderId || null,
          ...(fromUserId ? { saved_from: fromUserId } : {}),
        }).then(({ error }) => {
          if (error) { console.error("Kunde inte synka sparat recept:", error); showToast(`Kunde inte spara i mappen: ${error.message}`); }
        });
      }
    },
    createFolderAndSave: (recipeId, name, fromUserId) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const folderId = "f" + Date.now();
      const alreadySaved = data.saved.includes(recipeId);
      setData((d) => ({
        ...d,
        recipeFolders: [...(d.recipeFolders || []), { id: folderId, name: trimmed }],
        saved: alreadySaved ? d.saved : [recipeId, ...d.saved],
        recipeSavedAt: alreadySaved ? d.recipeSavedAt : { ...(d.recipeSavedAt || {}), [recipeId]: new Date().toISOString() },
        recipeSaves: alreadySaved ? d.recipeSaves : { ...d.recipeSaves, [recipeId]: (d.recipeSaves[recipeId] || 0) + 1 },
        recipeFolderOf: { ...(d.recipeFolderOf || {}), [recipeId]: folderId },
        recipeSavedFrom: fromUserId ? { ...(d.recipeSavedFrom || {}), [recipeId]: fromUserId } : (d.recipeSavedFrom || {}),
      }));
      showToast(`Mappen "${trimmed}" skapad`);
      setSheet(null);
      if (supabase && userId) {
        supabase.from("recipe_folders").insert({ id: folderId, user_id: userId, name: trimmed })
          .then(({ error }) => {
            if (error) { console.error("Kunde inte synka mappen (finns tabellen recipe_folders?):", error); showToast(`Mappen kunde inte synkas: ${error.message}`); }
          });
        upsertSaveWithFallback({
          recipe_id: recipeId, user_id: userId, folder_id: folderId,
          ...(fromUserId ? { saved_from: fromUserId } : {}),
        }).then(({ error }) => {
          if (error) { console.error("Kunde inte synka sparat recept:", error); showToast(`Kunde inte spara i mappen: ${error.message}`); }
        });
      }
    },
    createFolder: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const folderId = "f" + Date.now();
      setData((d) => ({ ...d, recipeFolders: [...(d.recipeFolders || []), { id: folderId, name: trimmed }] }));
      showToast(`Mappen "${trimmed}" skapad`);
      if (supabase && userId) {
        supabase.from("recipe_folders").insert({ id: folderId, user_id: userId, name: trimmed })
          .then(({ error }) => {
            if (error) { console.error("Kunde inte synka mappen (finns tabellen recipe_folders?):", error); showToast(`Mappen kunde inte synkas: ${error.message}`); }
          });
      }
    },
    renameFolder: (folderId, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setData((d) => ({
        ...d,
        recipeFolders: (d.recipeFolders || []).map((f) => (f.id === folderId ? { ...f, name: trimmed } : f)),
      }));
      if (supabase && userId) {
        supabase.from("recipe_folders").update({ name: trimmed }).eq("id", folderId).eq("user_id", userId)
          .then(({ error }) => {
            if (error) { console.error("Kunde inte synka mappnamnet:", error); showToast(`Namnbytet kunde inte synkas: ${error.message}`); }
          });
      }
    },
    deleteFolder: (folderId) => {
      setData((d) => {
        const recipeFolderOf = { ...(d.recipeFolderOf || {}) };
        Object.keys(recipeFolderOf).forEach((rid) => { if (recipeFolderOf[rid] === folderId) delete recipeFolderOf[rid]; });
        return {
          ...d,
          recipeFolders: (d.recipeFolders || []).filter((f) => f.id !== folderId),
          recipeFolderOf,
        };
      });
      showToast("Mappen borttagen");
      if (supabase && userId) {
        supabase.from("recipe_folders").delete().eq("id", folderId).eq("user_id", userId)
          .then(({ error }) => {
            if (error) { console.error("Kunde inte ta bort mappen:", error); showToast(`Borttagningen kunde inte synkas: ${error.message}`); }
          });
        supabase.from("saves").update({ folder_id: null }).eq("user_id", userId).eq("folder_id", folderId)
          .then(({ error }) => { if (error) console.error("Kunde inte rensa mappen från sparade recept:", error); });
      }
    },
    createRestaurantFolder: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const folderId = "rf" + Date.now();
      setData((d) => ({ ...d, restaurantFolders: [...(d.restaurantFolders || []), { id: folderId, name: trimmed }] }));
      if (supabase && userId) {
        supabase.from("restaurant_folders").insert({ id: folderId, user_id: userId, name: trimmed })
          .then(({ error }) => {
            if (error) { console.error("Kunde inte synka gruppen (finns tabellen restaurant_folders?):", error); showToast(`Gruppen kunde inte synkas: ${error.message}`); }
          });
      }
      return folderId;
    },
    renameRestaurantFolder: (folderId, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setData((d) => ({
        ...d,
        restaurantFolders: (d.restaurantFolders || []).map((f) => (f.id === folderId ? { ...f, name: trimmed } : f)),
      }));
      if (supabase && userId) {
        supabase.from("restaurant_folders").update({ name: trimmed }).eq("id", folderId).eq("user_id", userId)
          .then(({ error }) => {
            if (error) { console.error("Kunde inte synka gruppnamnet:", error); showToast(`Namnbytet kunde inte synkas: ${error.message}`); }
          });
      }
    },
    deleteRestaurantFolder: (folderId) => {
      setData((d) => {
        const restaurantFolderOf = { ...(d.restaurantFolderOf || {}) };
        Object.keys(restaurantFolderOf).forEach((cid) => { if (restaurantFolderOf[cid] === folderId) delete restaurantFolderOf[cid]; });
        return {
          ...d,
          restaurantFolders: (d.restaurantFolders || []).filter((f) => f.id !== folderId),
          restaurantFolderOf,
        };
      });
      showToast("Gruppen borttagen");
      if (supabase && userId) {
        supabase.from("restaurant_folders").delete().eq("id", folderId).eq("user_id", userId)
          .then(({ error }) => {
            if (error) { console.error("Kunde inte ta bort gruppen:", error); showToast(`Borttagningen kunde inte synkas: ${error.message}`); }
          });
        supabase.from("cooks").update({ folder_id: null }).eq("user_id", userId).eq("folder_id", folderId)
          .then(({ error }) => { if (error) console.error("Kunde inte rensa gruppen från platser:", error); });
      }
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
    logCook: (recipeId, note, photos, mods, custom, steps, folderId) => {
      const c = { id: "me-" + Date.now(), userId: "me", recipeId, date: new Date().toISOString(), note, mums: [], mumsAt: {}, comments: [], mods: mods || null, custom: custom || null, steps: steps || null };
      // XP ges bara för recept från Köket (author === null), inte för egna/andras recept eller enkla inlägg,
      // och bara om steget faktiskt är upplåst i Guide (samma spärr som receptväljaren och receptsidan använder) -
      // ett recept man hittat en annan väg, t.ex. via ett flödesinlägg, ska inte ge XP i förtid.
      const sourceRecipe = recipeId ? recipes[recipeId] : null;
      const cookedIds = data.myCooks.filter((cook) => cook.recipeId).map((cook) => cook.recipeId);
      const isUnlocked = !sourceRecipe || sourceRecipe.author !== null || unlockedGuideIds(recipes, cookedIds).has(recipeId);
      const xpGain = sourceRecipe && sourceRecipe.author === null && isUnlocked ? xpForRecipe(sourceRecipe) : 0;
      const newXp = (data.xp || 0) + xpGain;
      const list = photoList(photos);
      if (list.length) setPhotos((p) => ({ ...p, [c.id]: list, ...(recipeId ? { [recipeId]: list } : {}) }));
      setData((d) => ({
        ...d,
        myCooks: [c, ...d.myCooks],
        xp: xpGain ? (d.xp || 0) + xpGain : d.xp,
        restaurantFolderOf: folderId ? { ...(d.restaurantFolderOf || {}), [c.id]: folderId } : d.restaurantFolderOf,
      }));
      setSheet(null); setStack([]); setTab("feed");
      showToast(xpGain ? `Publicerat (+${xpGain} XP)` : "Publicerat");
      if (supabase && userId) {
        upsertWithPhotosFallback("cooks", {
          id: c.id, user_id: userId, recipe_id: recipeId || null, data: c, photo: list[0] || null, photos: list.length ? list : null,
          folder_id: folderId || null,
        }).then(({ error }) => {
          if (error) {
            console.error("Kunde inte publicera inlägg:", error);
            showToast(`Inlägget kunde inte synkas: ${error.message}`);
          }
        });
        if (xpGain) {
          USERS.me = { ...USERS.me, xp: newXp };
          supabase.from("profiles").update({ xp: newXp }).eq("id", userId)
            .then(({ error }) => { if (error) console.error("Kunde inte synka XP:", error); });
        }
      }
    },
    updateCook: (cookId, patch) => {
      const existing = data.myCooks.find((c) => c.id === cookId);
      if (!existing) return;
      const list = photoList(patch.photos);
      const updated = {
        ...existing,
        note: patch.note ?? existing.note,
        mods: "mods" in patch ? (patch.mods || null) : existing.mods,
        steps: "steps" in patch ? (patch.steps || null) : existing.steps,
        custom: "custom" in patch ? (patch.custom || null) : existing.custom,
      };
      setData((d) => ({
        ...d,
        myCooks: d.myCooks.map((c) => (c.id === cookId ? updated : c)),
        restaurantFolderOf: "folderId" in patch
          ? { ...(d.restaurantFolderOf || {}), [cookId]: patch.folderId || null }
          : d.restaurantFolderOf,
      }));
      setPhotos((p) => {
        const next = { ...p };
        if (list.length) next[cookId] = list; else delete next[cookId];
        return next;
      });
      setSheet(null);
      showToast("Ändringarna sparade");
      if (supabase && userId) {
        upsertWithPhotosFallback("cooks", {
          id: cookId, user_id: userId, recipe_id: updated.recipeId || null, data: updated,
          photo: list[0] || null, photos: list.length ? list : null,
          ...("folderId" in patch ? { folder_id: patch.folderId || null } : {}),
        }).then(({ error }) => {
          if (error) {
            console.error("Kunde inte spara ändringar:", error);
            showToast(`Ändringarna kunde inte synkas: ${error.message}`);
          }
        });
      }
    },
    addRecipe: (r, photos) => {
      const id = "u" + Date.now();
      const rec = { ...r, id, author: "me", tile: TILES[data.myRecipes.length % TILES.length] };
      const list = photoList(photos);
      if (list.length) setPhotos((p) => ({ ...p, [id]: list }));
      setData((d) => ({
        ...d,
        myRecipes: [rec, ...d.myRecipes],
        saved: [id, ...d.saved.filter((savedId) => savedId !== id)],
        recipeSavedAt: { ...(d.recipeSavedAt || {}), [id]: new Date().toISOString() },
        recipeSaves: { ...d.recipeSaves, [id]: 1 },
      }));
      setSheet(null);
      setStack((s) => [...s, { type: "recipe", id, k: Date.now() }]);
      showToast("Recept sparat");
      if (supabase && userId) {
        upsertWithPhotosFallback("recipes", { id, author_id: userId, data: rec, photo: list[0] || null, photos: list.length ? list : null })
          .then(({ error }) => {
            if (error) {
              console.error("Kunde inte publicera recept:", error);
              showToast(`Receptet kunde inte synkas: ${error.message}`);
            }
          });
        // Markera att man sparat sitt eget recept, annars försvinner det ur Mina recept
        // så fort listan hämtas från saves-tabellen igen.
        upsertSaveWithFallback({ recipe_id: id, user_id: userId })
          .then(({ error }) => { if (error) console.error("Kunde inte markera eget recept som sparat:", error); });
      }
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
          // Rensa också bort ur den delade cachen direkt, annars kan receptet dyka upp
          // igen i t.ex. Mina recept i upp till 20 sekunder tills nästa bakgrundssynk.
          sharedRecipes: d.sharedRecipes.filter((recipe) => recipe.id !== id),
          sharedCooks: d.sharedCooks.filter((cook) => !relatedCookIds.includes(cook.id)),
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
      if (supabase && userId) {
        deletedRecipeIds.current.add(id);
        relatedCookIds.forEach((cookId) => deletedCookIds.current.add(cookId));
        Promise.all([
          supabase.from("recipes").delete().eq("id", id).eq("author_id", userId),
          relatedCookIds.length
            ? supabase.from("cooks").delete().in("id", relatedCookIds).eq("user_id", userId)
            : Promise.resolve({ error: null }),
          supabase.from("saves").delete().eq("recipe_id", id).eq("user_id", userId),
        ]).then(([recipeResult, cooksResult, saveResult]) => {
          if (recipeResult.error) console.error("Kunde inte ta bort recept:", recipeResult.error);
          if (cooksResult.error) console.error("Kunde inte ta bort relaterade inlägg:", cooksResult.error);
          if (saveResult.error) console.error("Kunde inte ta bort sparat recept:", saveResult.error);
          deletedRecipeIds.current.delete(id);
          relatedCookIds.forEach((cookId) => deletedCookIds.current.delete(cookId));
        });
      }
    },
    deleteCook: (cookId, options = {}) => {
      const keepRecipe = !!options.keepRecipe;
      const derived = data.myRecipes.find((recipe) => recipe.sourceCookId === cookId);
      setData((d) => {
        const recipeSaves = { ...d.recipeSaves };
        if (derived && !keepRecipe) delete recipeSaves[derived.id];
        const restaurantFolderOf = { ...(d.restaurantFolderOf || {}) };
        delete restaurantFolderOf[cookId];
        return {
          ...d,
          myCooks: d.myCooks.filter((cook) => cook.id !== cookId),
          myRecipes: keepRecipe ? d.myRecipes : d.myRecipes.filter((recipe) => recipe.sourceCookId !== cookId),
          sharedCooks: d.sharedCooks.filter((cook) => cook.id !== cookId),
          sharedRecipes: derived && !keepRecipe ? d.sharedRecipes.filter((recipe) => recipe.id !== derived.id) : d.sharedRecipes,
          saved: derived && !keepRecipe ? d.saved.filter((savedId) => savedId !== derived.id) : d.saved,
          recipeSaves,
          restaurantFolderOf,
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
      showToast(derived && keepRecipe ? "Loggen är borttagen, receptet finns kvar" : "Loggen är borttagen");
      if (supabase && userId) {
        deletedCookIds.current.add(cookId);
        supabase.from("cooks").delete().eq("id", cookId).eq("user_id", userId)
          .then(({ error }) => {
            if (error) console.error("Kunde inte ta bort inlägg:", error);
            deletedCookIds.current.delete(cookId);
          });
        if (derived && !keepRecipe) {
          deletedRecipeIds.current.add(derived.id);
          Promise.all([
            supabase.from("recipes").delete().eq("id", derived.id).eq("author_id", userId),
            supabase.from("saves").delete().eq("recipe_id", derived.id).eq("user_id", userId),
          ]).then(([recipeResult, saveResult]) => {
            if (recipeResult.error) console.error("Kunde inte ta bort receptet:", recipeResult.error);
            if (saveResult.error) console.error("Kunde inte ta bort sparat recept:", saveResult.error);
            deletedRecipeIds.current.delete(derived.id);
          });
        }
      }
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
      const list = photoList(photos[cook.id]);
      if (list.length) setPhotos((p) => ({ ...p, [id]: list }));
      setData((d) => ({
        ...d,
        myRecipes: [rec, ...d.myRecipes],
        saved: [id, ...d.saved.filter((savedId) => savedId !== id)],
        recipeSavedAt: { ...(d.recipeSavedAt || {}), [id]: new Date().toISOString() },
        recipeSaves: { ...d.recipeSaves, [id]: 1 },
      }));
      showToast("Eget recept sparat");
      if (supabase && userId) {
        upsertWithPhotosFallback("recipes", { id, author_id: userId, data: rec, photo: list[0] || null, photos: list.length ? list : null })
          .then(({ error }) => {
            if (error) console.error("Kunde inte publicera sparat recept:", error);
          });
        upsertSaveWithFallback({ recipe_id: id, user_id: userId })
          .then(({ error }) => { if (error) console.error("Kunde inte markera eget recept som sparat:", error); });
      }
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
  };

  const TABS = [
    ["feed", "Start", Home],
    ["discover", "Guide", GraduationCap],
    ["plus", "Skapa", Plus],
    ["messages", "Meddelanden", MessageCircle],
    ["profile", "Profil", User],
  ];

  if (!authLoaded || (session && (!loaded || !profilesLoaded || !sharedLoaded))) {
    return <div className="k-root"><main className="k-auth-loading">Laddar Köket...</main></div>;
  }
  if (recovery) return <AuthScreen recovery onRecoveryComplete={async () => {
    setRecovery(false);
    await supabase.auth.signOut();
  }} />;
  if (!session) return <AuthScreen />;

  return (
    <PhotoCtx.Provider value={photos}>
    <div className="k-root" data-theme={data.darkMode ? "dark" : "light"}>
      <div className="k-phone">
        <div className="k-status" aria-hidden="true"><span>9:41</span><span className="k-batt"><i /></span></div>
        <div className="k-body">
          <main key={tab} className={"k-scroll" + (tab === "feed" ? " grey" : "")}>
            {tab === "feed" && <FeedScreen app={app} />}
            {tab === "discover" && <GuideScreen app={app} />}
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
                  onClick={() => {
                    setTab(id); setStack([]);
                    if (id === "messages") {
                      const seenAt = new Date().toISOString();
                      setData((d) => ({ ...d, messagesSeen: seenAt }));
                      syncUserState({ messages_seen: seenAt });
                    }
                  }}>
                  <span className="k-tab-icon">
                    {id === "profile" && photos["profile:me"] ? (
                      <Avatar user={USERS.me} size={25} />
                    ) : (
                      <Icon size={25} strokeWidth={tab === id ? 2.3 : 1.8} />
                    )}
                    {id === "messages" && unreadMessages > 0 && (
                      <span className="k-badge k-tab-badge">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                    )}
                  </span>
                  {label}
                </button>
              )
            )}
          </nav>

          {stack.map((v, i) => (
            <div key={v.k} className={"k-push" + (v.type === "mums" || v.type === "notifs" ? " k-push-glass" : "")} style={{ zIndex: 20 + i }}>
              {v.type === "recipe" && <RecipeView id={v.id} app={app} fromUserId={v.fromUserId} />}
              {v.type === "user" && <UserView id={v.id} app={app} />}
              {v.type === "cook" && <CookView id={v.id} app={app} focus={!!v.focus} />}
              {v.type === "notifs" && <NotifsView app={app} seenBefore={v.seenBefore} />}
              {v.type === "mums" && <MumsView cook={allCooks.find((c) => c.id === v.id)} app={app} />}
              {v.type === "follows" && <FollowsView uid={v.id} tab={v.tab} app={app} />}
              {v.type === "folder" && <FolderView id={v.id} app={app} />}
              {v.type === "restaurantFolder" && <RestaurantFolderView id={v.id} app={app} />}
            </div>
          ))}

          {sheet?.type === "action" && <ActionSheet app={app} onClose={() => setSheet(null)} />}
          {sheet?.type === "log" && <LogSheet app={app} initial={sheet.recipeId} editCook={sheet.editCookId ? allCooks.find((c) => c.id === sheet.editCookId) : null} onClose={() => setSheet(null)} />}
          {sheet?.type === "new" && <NewRecipeSheet app={app} onClose={() => setSheet(null)} />}
          {sheet?.type === "share" && <ShareSheet app={app} recipeId={sheet.recipeId} onClose={() => setSheet(null)} />}
          {sheet?.type === "profile-settings" && <ProfileSettingsSheet app={app} onClose={() => setSheet(null)} />}
          {sheet?.type === "edit-profile" && <EditProfileSheet app={app} onClose={() => setSheet(null)} />}
          {sheet?.type === "saveTo" && <SaveRecipeSheet app={app} recipeId={sheet.recipeId} fromUserId={sheet.fromUserId} onClose={() => setSheet(null)} />}
          {sheet?.type === "my-folders" && <MyFoldersSheet app={app} onClose={() => setSheet(null)} />}
          {sheet?.type === "my-restaurant-folders" && <MyRestaurantFoldersSheet app={app} onClose={() => setSheet(null)} />}
          {sheet?.type === "simple-post" && <SimplePostSheet app={app} onClose={() => setSheet(null)} />}
          {sheet?.type === "chef-titles" && <ChefTitlesSheet onClose={() => setSheet(null)} />}

          {toast && <div key={toast.k} className="k-toast" role="status"><Check size={16} strokeWidth={3} />{toast.text}</div>}
        </div>
        <div className="k-homebar" />
      </div>
    </div>
    </PhotoCtx.Provider>
  );
}
