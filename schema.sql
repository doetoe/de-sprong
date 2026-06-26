-- schema.sql
-- Definieert alle tabellen voor De Sprong.
-- Dit bestand wordt uitgevoerd door scripts/init-db.js om de database aan te maken.
-- Bij schemawijzigingen: pas dit bestand aan en voer init-db opnieuw uit.

-- Schakel foreign key support in.
-- SQLite heeft dit standaard uitgeschakeld; wij willen wel dat cascade delete werkt.
PRAGMA foreign_keys = ON;

-- Tabel: categorie
-- Een categorie is een tab op de hoofdpagina, bijv. "Songs" of "Oefenmateriaal".
-- In de eerste versie zijn er twee vaste categorieën (aangemaakt via het seed-script).
-- Het veld 'volgorde' is bedoeld voor toekomstige versies waarin tabs verplaatst kunnen worden.
CREATE TABLE IF NOT EXISTS categorie (
    id       INTEGER PRIMARY KEY,
    naam     TEXT    NOT NULL,
    volgorde INTEGER NOT NULL DEFAULT 0
);

-- Tabel: stuk
-- Een stuk is een song of een stuk oefenmateriaal.
-- Het hoort bij één categorie (bijv. "Songs").
-- top_prio: 0 = nee, 1 = ja. SQLite heeft geen apart boolean-type; we gebruiken integer.
CREATE TABLE IF NOT EXISTS stuk (
    id           INTEGER PRIMARY KEY,
    categorie_id INTEGER NOT NULL REFERENCES categorie(id),
    naam         TEXT    NOT NULL,
    info         TEXT,                                      -- vrije tekst, meerdere regels
    toonsoort    TEXT,
    top_prio     INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Tabel: bron
-- Een bron is studiemateriaal bij een stuk: een YouTube-video, Spotify-track, of andere link.
-- 'volgorde' bepaalt de weergavevolgorde op de detailpagina (aanpasbaar via drag-and-drop).
-- ON DELETE CASCADE zorgt dat bronnen automatisch verwijderd worden als het stuk verwijderd wordt.
CREATE TABLE IF NOT EXISTS bron (
    id         INTEGER PRIMARY KEY,
    stuk_id    INTEGER NOT NULL REFERENCES stuk(id) ON DELETE CASCADE,
    naam       TEXT    NOT NULL,
    info       TEXT,                                        -- vrije tekst, meerdere regels
    toonsoort  TEXT,                                        -- kan afwijken van het stuk
    link       TEXT,                                        -- URL naar YouTube, Spotify, etc.
    volgorde   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
