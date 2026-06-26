// src/routes/stuk/[id]/+page.server.ts
// Server-side logica voor de detailpagina van een stuk (/stuk/[id]).
//
// Laadt het stuk en zijn bronnen.
// Verwerkt acties voor: stuk opslaan, stuk verwijderen, bron aanmaken,
// bron opslaan, bron verwijderen, en volgorde bijwerken.

import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getStuk,
	getBronnenVoorStuk,
	werkStukBij,
	verwijderStuk,
	maakBron,
	werkBronBij,
	verwijderBron,
	werkVolgordeBij
} from '$lib/server/db';

// Laad het stuk en zijn bronnen.
// '[id]' uit de URL wordt meegegeven als 'params.id'.
export const load: PageServerLoad = ({ params }) => {
	const id = parseInt(params.id, 10);

	// Als het id geen geldig getal is, geef een 404-fout
	if (isNaN(id)) {
		error(404, 'Stuk niet gevonden');
	}

	const stuk = getStuk(id);

	// Als het stuk niet bestaat in de database, geef een 404-fout
	if (!stuk) {
		error(404, 'Stuk niet gevonden');
	}

	const bronnen = getBronnenVoorStuk(id);

	return { stuk, bronnen };
};

export const actions: Actions = {
	// Slaat de gegevens van het stuk op (naam, info, toonsoort, top_prio).
	slaStukOp: async ({ params, request }) => {
		const id = parseInt(params.id, 10);
		if (isNaN(id)) return fail(400, { fout: 'Ongeldig id' });

		const data = await request.formData();
		const naam = data.get('naam');
		if (!naam || typeof naam !== 'string' || naam.trim() === '') {
			return fail(400, { fout: 'Naam is verplicht' });
		}

		werkStukBij(id, {
			naam: naam.trim(),
			info: (data.get('info') as string | null) || null,
			toonsoort: (data.get('toonsoort') as string | null) || null,
			// Checkbox-velden sturen 'on' als aangevinkt, anders zijn ze afwezig
			top_prio: data.get('top_prio') === 'on' ? 1 : 0
		});

		// Stuur een succesbericht terug (de pagina herlaadt de bijgewerkte data)
		return { success: true };
	},

	// Verwijdert het stuk en navigeert terug naar de hoofdpagina.
	verwijderStuk: async ({ params }) => {
		const id = parseInt(params.id, 10);
		if (isNaN(id)) return fail(400, { fout: 'Ongeldig id' });

		verwijderStuk(id);

		// Na verwijderen: terug naar de hoofdpagina
		redirect(303, '/');
	},

	// Maakt een nieuwe bron aan voor dit stuk.
	nieuweBron: async ({ params }) => {
		const stukId = parseInt(params.id, 10);
		if (isNaN(stukId)) return fail(400, { fout: 'Ongeldig stuk-id' });

		maakBron(stukId, 'Nieuwe bron');

		return { success: true };
	},

	// Slaat de gegevens van een bron op.
	slaBronOp: async ({ request }) => {
		const data = await request.formData();

		const idStr = data.get('id');
		if (!idStr || typeof idStr !== 'string') return fail(400, { fout: 'Bron-id ontbreekt' });

		const id = parseInt(idStr, 10);
		if (isNaN(id)) return fail(400, { fout: 'Ongeldig bron-id' });

		const naam = data.get('naam');
		if (!naam || typeof naam !== 'string' || naam.trim() === '') {
			return fail(400, { fout: 'Naam is verplicht' });
		}

		werkBronBij(id, {
			naam: naam.trim(),
			info: (data.get('info') as string | null) || null,
			toonsoort: (data.get('toonsoort') as string | null) || null,
			link: (data.get('link') as string | null) || null
		});

		return { success: true };
	},

	// Verwijdert een bron.
	verwijderBron: async ({ request }) => {
		const data = await request.formData();

		const idStr = data.get('id');
		if (!idStr || typeof idStr !== 'string') return fail(400, { fout: 'Bron-id ontbreekt' });

		const id = parseInt(idStr, 10);
		if (isNaN(id)) return fail(400, { fout: 'Ongeldig bron-id' });

		verwijderBron(id);

		return { success: true };
	},

	// Werkt de volgorde van bronnen bij na een drag-and-drop actie.
	// De nieuwe volgorde wordt als JSON-string meegestuurd.
	werkVolgordeBij: async ({ request }) => {
		const data = await request.formData();

		const volgorde = data.get('volgorde');
		if (!volgorde || typeof volgorde !== 'string') {
			return fail(400, { fout: 'Volgorde ontbreekt' });
		}

		// Parseer de JSON-array met { id, volgorde } objecten
		let volgorden: { id: number; volgorde: number }[];
		try {
			volgorden = JSON.parse(volgorde);
		} catch {
			return fail(400, { fout: 'Ongeldige volgorde-data' });
		}

		werkVolgordeBij(volgorden);

		return { success: true };
	}
};
