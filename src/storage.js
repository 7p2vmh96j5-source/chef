// Ersätter window.storage från Claude-artefakten med webbläsarens localStorage.
// Samma gränssnitt, så resten av appen behöver inte ändras.
// När du går över till Supabase byts den här filen ut mot riktiga databasanrop.

const PREFIX = "koket-app:";

window.storage = {
  async get(key) {
    const value = localStorage.getItem(PREFIX + key);
    if (value === null) throw new Error(`Nyckeln finns inte: ${key}`);
    return { key, value, shared: false };
  },
  async set(key, value) {
    localStorage.setItem(PREFIX + key, value); // kastar fel om lagringen är full
    return { key, value, shared: false };
  },
  async delete(key) {
    localStorage.removeItem(PREFIX + key);
    return { key, deleted: true, shared: false };
  },
  async list(prefix = "") {
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX + prefix))
      .map((k) => k.slice(PREFIX.length));
    return { keys, prefix, shared: false };
  },
};
