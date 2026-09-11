// Inloggad användare. Familjemedlemmar läggs till via Supabase och ska inte
// hårdkodas som demoanvändare i appen.

export const USERS = {
  me: { id: "me", name: "Min profil", bio: "", color: "#6D8CA5", fg: "#fff" },
};

export const SHARED = [];

export const FOLLOWERS = [];

// Vem användaren följer hämtas senare från Supabase.
export const GRAPH = {};
