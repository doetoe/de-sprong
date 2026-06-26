// scripts/init-db.js
// Initialiseert de SQLite-database voor De Sprong.
// Voer dit script uit via: npm run db:init
//
// Wat dit script doet:
//   1. Maakt de 'data' map aan als die nog niet bestaat
//   2. Leest schema.sql en voert alle CREATE TABLE statements uit
//   3. Voegt de twee vaste categorieën toe als die nog niet bestaan

import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Bepaal de map van dit script (werkt ook als ESM module)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Pad naar de 'data' map en het database-bestand, relatief aan de project-root
const dataDir = join(__dirname, '..', 'data');
const dbPath = join(dataDir, 'de-sprong.db');

// Zorg dat de 'data' map bestaat
mkdirSync(dataDir, { recursive: true });

// Open (of maak) de database
const db = new Database(dbPath);

// Lees en voer het schema uit
// 'readFileSync' leest het bestand als tekst; 'exec' voert meerdere SQL-statements tegelijk uit
const schema = readFileSync(join(__dirname, '..', 'schema.sql'), 'utf-8');
db.exec(schema);

// Schakel foreign keys in voor deze verbinding
db.pragma('foreign_keys = ON');

// Seed: voeg de twee vaste categorieën toe, maar alleen als ze nog niet bestaan.
// 'INSERT OR IGNORE' slaat de insert over als er al een rij met dezelfde naam is.
const insertCategorie = db.prepare(
	'INSERT OR IGNORE INTO categorie (naam, volgorde) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM categorie WHERE naam = ?)'
);

insertCategorie.run('Songs', 1, 'Songs');
insertCategorie.run('Oefenmateriaal', 2, 'Oefenmateriaal');

console.log('✓ Database geïnitialiseerd:', dbPath);
console.log('✓ Categorieën aangemaakt (of al aanwezig): Songs, Oefenmateriaal');

db.close();
