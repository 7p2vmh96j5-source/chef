// Kör en SQL-fil direkt mot Supabase-databasen via SUPABASE_DB_URL i .env.local.
// Används för att applicera supabase-schema.sql utan att klistra in manuellt i SQL-editorn.
// Användning: node scripts/run-sql.mjs [sökväg-till-sql-fil]  (default: supabase-schema.sql)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const envPath = path.join(root, ".env.local");
const env = readFileSync(envPath, "utf8");
for (const line of env.split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
}

// Diskreta fält (inte en URI) så att specialtecken i lösenordet inte behöver URL-kodas.
const { SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_NAME, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD, SUPABASE_DB_URL } = process.env;

let clientConfig;
if (SUPABASE_DB_HOST && SUPABASE_DB_USER && SUPABASE_DB_PASSWORD) {
  clientConfig = {
    host: SUPABASE_DB_HOST,
    port: Number(SUPABASE_DB_PORT) || 5432,
    database: SUPABASE_DB_NAME || "postgres",
    user: SUPABASE_DB_USER,
    password: SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  };
} else if (SUPABASE_DB_URL) {
  clientConfig = { connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } };
} else {
  console.error("Ingen databasanslutning i .env.local (SUPABASE_DB_HOST/USER/PASSWORD eller SUPABASE_DB_URL)");
  process.exit(1);
}

const sqlFile = process.argv[2] || path.join(root, "supabase-schema.sql");
const sql = readFileSync(sqlFile, "utf8");

const client = new pg.Client(clientConfig);

try {
  await client.connect();
  console.log(`Ansluten. Kör ${path.relative(root, sqlFile)}...`);
  await client.query(sql);
  console.log("Klart - schemat är applicerat.");
} catch (error) {
  console.error("Fel vid körning av SQL:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
