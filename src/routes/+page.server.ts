// src/routes/+page.server.ts
// Server-side logica voor de hoofdpagina (/).
//
// SvelteKit scheidt server-code (bestanden eindigend op .server.ts) van client-code.
// Dit bestand draait altijd op de server, nooit in de browser.
//
// 'load': laadt de data die de pagina nodig heeft vóórdat die getoond wordt.
// 'actions': verwerkt formulier-verzendingen (bijv. een stuk verwijderen of aanmaken).

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAlleCategorieen, getStukkenVoorCategorie, maakStuk, verwijderStuk } from '$lib/server/db';

// Laad alle categorieën en hun stukken voor de hoofdpagina.
// De 'load' functie wordt uitgevoerd bij elke paginabezoek.
export const load: PageServerLoad = () => {
	const categorieen = getAlleCategorieen();

	// Voor elke categorie laden we de bijbehorende stukken.
	// De stukken zijn al gesorteerd (top_prio eerst, dan alfabetisch) door de db-functie.
	const categorieen_met_stukken = categorieen.map((cat) => ({
		...cat,
		stukken: getStukkenVoorCategorie(cat.id)
	}));

	return { categorieen: categorieen_met_stukken };
};

// Actions verwerken formulier-verzendingen via POST.
// SvelteKit actions zijn de 'server-side manier' om data te wijzigen.
export const actions: Actions = {
	// Maakt een nieuw stuk aan en navigeert naar de detailpagina.
	nieuwStuk: async ({ request }) => {
		const data = await request.formData();

		// Haal de categorie_id op uit het formulier
		const categorieIdStr = data.get('categorie_id');
		if (!categorieIdStr || typeof categorieIdStr !== 'string') {
			return fail(400, { fout: 'Categorie ontbreekt' });
		}

		const categorieId = parseInt(categorieIdStr, 10);
		if (isNaN(categorieId)) {
			return fail(400, { fout: 'Ongeldige categorie' });
		}

		// Maak het stuk aan met een standaard naam (te bewerken op de detailpagina)
		const nieuwId = maakStuk(categorieId, 'Nieuw stuk');

		// Stuur de gebruiker direct door naar de detailpagina van het nieuwe stuk
		redirect(303, `/stuk/${nieuwId}`);
	},

	// Verwijdert een stuk (inclusief alle bijbehorende bronnen via cascade delete).
	verwijderStuk: async ({ request }) => {
		const data = await request.formData();

		const idStr = data.get('id');
		if (!idStr || typeof idStr !== 'string') {
			return fail(400, { fout: 'Id ontbreekt' });
		}

		const id = parseInt(idStr, 10);
		if (isNaN(id)) {
			return fail(400, { fout: 'Ongeldig id' });
		}

		verwijderStuk(id);

		// Geen redirect nodig: de pagina herlaadt automatisch na een action
	}
};
