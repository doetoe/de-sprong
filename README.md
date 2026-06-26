# De Sprong
### O, Romantiek Der Hazen
*gebaseerd op een compositie van Misha Mengelberg*

Een webapplicatie voor het managen van oefenmateriaal voor piano (of een ander instrument).

Organiseer je repertoire en studiemateriaal in categorieën, voeg bronnen toe (YouTube-video's, Spotify-tracks, links), en houd bij wat prioriteit heeft.

---

## Gebruikersinstructies

### Hoofdpagina
- De app opent met twee tabs: **Songs** en **Oefenmateriaal**
- Stukken met hoge prioriteit verschijnen bovenaan; de rest staat alfabetisch
- Klik op een stuk om de detailpagina te openen
- Gebruik de knop **Nieuw stuk** om een stuk toe te voegen
- Gebruik de verwijderknop (met bevestiging) om een stuk te verwijderen

### Detailpagina
- Bewerk naam, toonsoort, notities en prioriteit via het formulier; sla op met **Opslaan**
- Voeg bronnen toe met de knop **Nieuwe bron**
- Per bron: vul naam, toonsoort, notities en een link in (YouTube, Spotify of andere URL)
- YouTube- en Spotify-links worden automatisch als embed getoond
- Versleep bronnen om de volgorde aan te passen
- Verwijder een bron via de verwijderknop (met bevestiging)

---

## Installatie

### Vereisten
- [Node.js](https://nodejs.org/) versie 18 of hoger
- [npm](https://www.npmjs.com/) (wordt meegeleverd met Node.js)
- [Git](https://git-scm.com/)

### Stappen

```bash
# 1. Repository klonen
git clone https://github.com/doetoe/de-sprong.git
cd de-sprong

# 2. Afhankelijkheden installeren
npm install

# 3. Database initialiseren (maakt een leeg .db bestand aan met de juiste tabellen)
npm run db:init

# 4. Ontwikkelserver starten
npm run dev
```

De app is nu bereikbaar op [http://localhost:5173](http://localhost:5173).

### Dependencies

| Pakket | Doel |
|--------|------|
| [SvelteKit](https://kit.svelte.dev/) | Full-stack webframework (UI + server routes) |
| [Svelte](https://svelte.dev/) | UI-componentensysteem |
| [TypeScript](https://www.typescriptlang.org/) | Getypeerde JavaScript |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS-framework |
| [DaisyUI](https://daisyui.com/) | Componentenbibliotheek op basis van Tailwind |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | SQLite-database toegang (raw SQL) |
| [svelte-dnd-action](https://github.com/isaacHagoel/svelte-dnd-action) | Drag-and-drop voor bronvolgorde |
| [Vitest](https://vitest.dev/) | Unit tests |
| [Playwright](https://playwright.dev/) | End-to-end tests |

---

## Projectstructuur

```
src/
  lib/
    server/
      db.ts          # Database-verbinding en helper-functies
    linkDetector.ts  # Detecteert YouTube, Spotify en gewone links
  routes/
    +page.svelte     # Hoofdpagina (tabs + stukkenlijst)
    stuk/[id]/
      +page.svelte   # Detailpagina (stuk + bronnen)
schema.sql           # Database schema (tabellen en constraints)
```

---

## Technische keuzes

- **SvelteKit**: één framework voor zowel de UI als de server-side API
- **better-sqlite3 + raw SQL**: eenvoudig, leesbaar en educatief — geen ORM-abstractielaag
- **DaisyUI**: professioneel uitziende componenten zonder veel configuratie
- **SQLite**: één `.db` bestand, geen aparte databaseserver nodig

---

## Licentie

Persoonlijk project — geen licentie van toepassing.
