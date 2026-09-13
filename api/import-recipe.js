// Hämtar ett enskilt recept som användaren länkar till och läser sidans
// strukturerade receptdata (schema.org/Recipe, samma metadata som Google
// använder för receptkort i sökresultat). Körs bara på användarens egen
// begäran för en (1) sida i taget - ingen bakgrundsindexering eller
// masshämtning av hela sajter.

function isPrivateHost(hostname) {
  if (hostname === "localhost" || hostname === "0.0.0.0") return true;
  const ip = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ip) {
    const a = Number(ip[1]);
    const b = Number(ip[2]);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

function findRecipeNode(node, depth = 0) {
  if (!node || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  const type = node["@type"];
  if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) return node;
  if (node["@graph"]) {
    const found = findRecipeNode(node["@graph"], depth + 1);
    if (found) return found;
  }
  for (const key of Object.keys(node)) {
    if (key === "@type" || key === "@graph") continue;
    const val = node[key];
    if (val && typeof val === "object") {
      const found = findRecipeNode(val, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value["@value"] === "string") return value["@value"];
  return "";
}

function extractSteps(instructions) {
  if (!instructions) return [];
  if (typeof instructions === "string") {
    return instructions.split(/\r?\n+/).map((s) => s.replace(/^\d+[.)]\s*/, "").trim()).filter(Boolean);
  }
  if (Array.isArray(instructions)) {
    const out = [];
    instructions.forEach((item) => {
      if (typeof item === "string") { out.push(item.trim()); return; }
      if (!item || typeof item !== "object") return;
      if (Array.isArray(item.itemListElement)) { out.push(...extractSteps(item.itemListElement)); return; }
      const t = textOf(item.text) || textOf(item.name);
      if (t) out.push(t.trim());
    });
    return out.filter(Boolean);
  }
  return [];
}

function extractIngredients(recipe) {
  const list = recipe.recipeIngredient || recipe.ingredients || [];
  if (!Array.isArray(list)) return [];
  return list.map((x) => textOf(x).trim()).filter(Boolean);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const raw = req.query?.url;
  if (!raw || typeof raw !== "string") {
    res.status(400).json({ error: "Ingen länk angavs." });
    return;
  }

  let target;
  try {
    target = new URL(raw);
  } catch {
    res.status(400).json({ error: "Länken ser inte giltig ut." });
    return;
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    res.status(400).json({ error: "Länken måste vara en vanlig webbadress." });
    return;
  }
  if (isPrivateHost(target.hostname)) {
    res.status(400).json({ error: "Den länken kan inte hämtas." });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let html;
  try {
    const response = await fetch(target.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FoodthoRecipeImport/1.0; +personal recipe import)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      res.status(502).json({ error: "Sidan kunde inte hämtas." });
      return;
    }
    html = await response.text();
  } catch (e) {
    res.status(502).json({ error: "Sidan kunde inte hämtas. Kontrollera länken och försök igen." });
    return;
  } finally {
    clearTimeout(timeout);
  }

  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1]);

  let recipe = null;
  for (const block of scripts) {
    try {
      const parsed = JSON.parse(block.trim());
      const found = findRecipeNode(parsed);
      if (found) { recipe = found; break; }
    } catch {
      // ignorera trasig eller ofullständig JSON-LD och fortsätt leta
    }
  }

  if (!recipe) {
    res.status(404).json({ error: "Hittade inget recept på den sidan. Prova att lägga till receptet manuellt istället." });
    return;
  }

  const title = textOf(recipe.name).trim();
  const ingredients = extractIngredients(recipe);
  const steps = extractSteps(recipe.recipeInstructions);

  if (!title || ingredients.length === 0) {
    res.status(404).json({ error: "Sidan innehöll ofullständig receptdata. Prova att lägga till receptet manuellt istället." });
    return;
  }

  res.status(200).json({
    title,
    ingredients,
    steps,
    sourceUrl: target.toString(),
    sourceName: target.hostname.replace(/^www\./, ""),
  });
}
