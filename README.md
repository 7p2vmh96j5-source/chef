# Köket

Social app för matlagning och bakning.(React + Vite).

## Kom igång

Du behöver [Node.js](https://nodejs.org) (LTS-versionen) och gärna [VS Code](https://code.visualstudio.com).

```bash
npm install     # första gången, hämtar paketen
npm run dev     # startar appen
```

Öppna adressen som visas, oftast http://localhost:5173.

### Testa på din iPhone

`npm run dev` visar också en nätverksadress (t.ex. `http://192.168.1.23:5173`). Öppna den i Safari på telefonen när den är på samma wifi. Välj **Dela → Lägg till på hemskärmen** så öppnas appen i helskärm.

## Filer

| Fil | Vad den gör |
| --- | --- |
| `src/App.jsx` | Hela appen|
| `src/storage.js` | Sparar data i webbläsaren. Byts mot Supabase senare |
| `src/main.jsx` | Startar appen |
| `index.html` | Sidan appen laddas i |

Data sparas i webbläsarens localStorage, alltså bara på den enhet du använder. Foton tar mycket plats, så lagringen kan bli full efter ett tjugotal bilder.

## Nästa steg

1. Lägg projektet på GitHub.
2. Dela upp `App.jsx` i flera filer (skärmar, komponenter, data).
3. Koppla på Supabase: konton, databas och fotolagring.
4. Bygg iOS-appen med Expo (React Native) och återanvänd datalogiken.
