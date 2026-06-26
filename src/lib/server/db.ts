// src/lib/server/db.ts
// Database-module voor De Sprong.
//
// Dit bestand beheert de verbinding met de SQLite-database en biedt
// helper-functies voor alle databaseoperaties in de app.
//
// Waarom 'server'-map? SvelteKit importeert bestanden in src/lib/server/ nooit
// naar de browser — dit zijn server-only bestanden. De database mag nooit
// client-side benaderd worden.
//
// Gebruik:
//   import { db } from '$lib/server/db';
//   const stukken = db.prepare('SELECT * FROM stuk').all();

import Database from 'better-sqlite3';
import { join } from 'path';

// Bepaal het pad naar het database-bestand.
// In development staat het in de 'data' map van de project-root.
// Later (bij hosting) kan dit via een omgevingsvariabele ingesteld worden.
const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), 'data', 'de-sprong.db');

// Maak één database-verbinding aan die de hele applicatie gebruikt (singleton).
// better-sqlite3 is synchronous (blokkerend), wat prima is voor een persoonlijke app
// met weinig gelijktijdige gebruikers.
const db = new Database(dbPath);

// Schakel foreign key support in voor deze verbinding.
// Dit zorgt dat ON DELETE CASCADE werkt (bronnen worden verwijderd als een stuk verwijderd wordt).
db.pragma('foreign_keys = ON');

// Exporteer de verbinding zodat andere server-bestanden er gebruik van kunnen maken.
export { db };

// ─── Types ───────────────────────────────────────────────────────────────────
// TypeScript-types die overeenkomen met de database-tabellen.
// Dit geeft automatische foutmeldingen als je een verkeerd veld gebruikt.

export type Categorie = {
	id: number;
	naam: string;
	volgorde: number;
};

export type Stuk = {
	id: number;
	categorie_id: number;
	naam: string;
	info: string | null;
	toonsoort: string | null;
	top_prio: number; // 0 of 1 (SQLite heeft geen boolean)
	created_at: string;
	updated_at: string;
};

export type Bron = {
	id: number;
	stuk_id: number;
	naam: string;
	info: string | null;
	toonsoort: string | null;
	link: string | null;
	volgorde: number;
	created_at: string;
	updated_at: string;
};

// ─── Categorieën ─────────────────────────────────────────────────────────────

// Geeft alle categorieën terug, gesorteerd op volgorde.
export function getAlleCategorieen(): Categorie[] {
	return db.prepare('SELECT * FROM categorie ORDER BY volgorde').all() as Categorie[];
}

// ─── Stukken ─────────────────────────────────────────────────────────────────

// Geeft alle stukken voor een categorie terug.
// Gesorteerd: top_prio-stukken eerst (DESC), daarbinnen alfabetisch op naam.
export function getStukkenVoorCategorie(categorieId: number): Stuk[] {
	return db
		.prepare('SELECT * FROM stuk WHERE categorie_id = ? ORDER BY top_prio DESC, naam COLLATE NOCASE ASC')
		.all(categorieId) as Stuk[];
}

// Geeft één stuk terug op basis van id, of null als het niet bestaat.
export function getStuk(id: number): Stuk | null {
	return (db.prepare('SELECT * FROM stuk WHERE id = ?').get(id) as Stuk) ?? null;
}

// Maakt een nieuw stuk aan en geeft het id terug.
export function maakStuk(categorieId: number, naam: string): number {
	const result = db
		.prepare('INSERT INTO stuk (categorie_id, naam) VALUES (?, ?)')
		.run(categorieId, naam);
	return result.lastInsertRowid as number;
}

// Werkt een stuk bij. updated_at wordt automatisch op het huidige tijdstip gezet.
export function werkStukBij(id: number, velden: Partial<Omit<Stuk, 'id' | 'created_at' | 'updated_at'>>): void {
	db.prepare(`
		UPDATE stuk
		SET naam = COALESCE(?, naam),
		    info = ?,
		    toonsoort = ?,
		    top_prio = COALESCE(?, top_prio),
		    updated_at = datetime('now')
		WHERE id = ?
	`).run(velden.naam ?? null, velden.info ?? null, velden.toonsoort ?? null, velden.top_prio ?? null, id);
}

// Verwijdert een stuk en al zijn bronnen (via cascade delete).
export function verwijderStuk(id: number): void {
	db.prepare('DELETE FROM stuk WHERE id = ?').run(id);
}

// ─── Bronnen ──────────────────────────────────────────────────────────────────

// Geeft alle bronnen voor een stuk terug, gesorteerd op volgorde.
export function getBronnenVoorStuk(stukId: number): Bron[] {
	return db
		.prepare('SELECT * FROM bron WHERE stuk_id = ? ORDER BY volgorde ASC')
		.all(stukId) as Bron[];
}

// Maakt een nieuwe bron aan en geeft het id terug.
// De volgorde wordt automatisch ingesteld op het hoogste getal + 1.
export function maakBron(stukId: number, naam: string): number {
	// Bepaal de hoogste huidige volgorde voor dit stuk
	const max = (db
		.prepare('SELECT MAX(volgorde) as max FROM bron WHERE stuk_id = ?')
		.get(stukId) as { max: number | null }).max ?? -1;

	const result = db
		.prepare('INSERT INTO bron (stuk_id, naam, volgorde) VALUES (?, ?, ?)')
		.run(stukId, naam, max + 1);
	return result.lastInsertRowid as number;
}

// Werkt een bron bij. updated_at wordt automatisch op het huidige tijdstip gezet.
export function werkBronBij(id: number, velden: Partial<Omit<Bron, 'id' | 'stuk_id' | 'created_at' | 'updated_at'>>): void {
	db.prepare(`
		UPDATE bron
		SET naam = COALESCE(?, naam),
		    info = ?,
		    toonsoort = ?,
		    link = ?,
		    volgorde = COALESCE(?, volgorde),
		    updated_at = datetime('now')
		WHERE id = ?
	`).run(
		velden.naam ?? null,
		velden.info ?? null,
		velden.toonsoort ?? null,
		velden.link ?? null,
		velden.volgorde ?? null,
		id
	);
}

// Verwijdert een bron.
export function verwijderBron(id: number): void {
	db.prepare('DELETE FROM bron WHERE id = ?').run(id);
}

// Werkt de volgorde van meerdere bronnen tegelijk bij.
// 'volgorden' is een array van { id, volgorde } objecten.
export function werkVolgordeBij(volgorden: { id: number; volgorde: number }[]): void {
	// Gebruik een transactie zodat alle updates tegelijk slagen of falen.
	const update = db.prepare('UPDATE bron SET volgorde = ? WHERE id = ?');
	const transactie = db.transaction((items: { id: number; volgorde: number }[]) => {
		for (const item of items) {
			update.run(item.volgorde, item.id);
		}
	});
	transactie(volgorden);
}
