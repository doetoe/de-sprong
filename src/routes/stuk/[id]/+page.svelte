<!--
  src/routes/stuk/[id]/+page.svelte
  Detailpagina voor een stuk.

  Toont en laat bewerken:
    - De gegevens van het stuk (naam, info, toonsoort, prioriteit)
    - De lijst van bronnen (met drag-and-drop volgorde)
    - Per bron: naam, info, toonsoort, link (met automatische embed voor YouTube/Spotify)

  Alle wijzigingen worden opgeslagen via formulieren met SvelteKit 'enhance'.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { dndzone } from 'svelte-dnd-action';
	import { detecteerLink } from '$lib/linkDetector';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';
	import type { Bron } from '$lib/server/db';

	let { data }: { data: PageData } = $props();

	// Lokale kopie van het stuk voor het formulier.
	// We gebruiken 'untrack' om de beginwaarden eenmalig te lezen zonder dat Svelte
	// automatisch reageert op toekomstige wijzigingen in 'data' (die zou de gebruiker
	// tijdens het typen overschrijven).
	let naam = $state(untrack(() => data.stuk.naam));
	let info = $state(untrack(() => data.stuk.info ?? ''));
	let toonsoort = $state(untrack(() => data.stuk.toonsoort ?? ''));
	let topPrio = $state(untrack(() => data.stuk.top_prio === 1));

	// Bijhouden of het stuk-formulier opgeslagen is
	let stukOpgeslagen = $state(false);

	// De lijst van bronnen (lokale kopie voor drag-and-drop)
	// untrack: beginwaarde eenmalig lezen; de $effect hieronder synchroniseert later
	let bronnen = $state<Bron[]>(untrack(() => [...data.bronnen]));

	// Bijhouden welke bron bevestigd moet worden voor verwijdering
	let teVerwijderenBronId = $state<number | null>(null);

	// Bijhouden of er een drag-and-drop actie gaande is
	let slepenActief = $state(false);

	// Wanneer de server nieuwe data stuurt (na een action), synchroniseren we de lokale staat
	$effect(() => {
		bronnen = [...data.bronnen];
	});

	// Verwerk drag-and-drop: update de lokale volgorde terwijl de gebruiker sleept
	function handleDndConsider(e: CustomEvent<{ items: Bron[] }>) {
		bronnen = e.detail.items;
		slepenActief = true;
	}

	// Wanneer de gebruiker loslaat: sla de nieuwe volgorde op via een formulier
	function handleDndFinalize(e: CustomEvent<{ items: Bron[] }>) {
		bronnen = e.detail.items;
		slepenActief = false;

		// Stuur de nieuwe volgorde naar de server
		// We gebruiken fetch omdat we niet willen dat de pagina herlaadt
		const volgorden = bronnen.map((b, index) => ({ id: b.id, volgorde: index }));
		const formData = new FormData();
		formData.append('volgorde', JSON.stringify(volgorden));

		fetch('?/werkVolgordeBij', {
			method: 'POST',
			body: formData
		});
	}
</script>

<svelte:head>
	<title>{naam} — De Sprong</title>
</svelte:head>

<div class="container mx-auto max-w-2xl p-4">
	<!-- Navigatie terug naar hoofdpagina -->
	<a href="/" class="btn btn-ghost btn-sm mb-4">← Terug</a>

	<!-- ─── Stuk-formulier ─────────────────────────────────────────────── -->
	<div class="card bg-base-100 border mb-6 p-4">
		<h1 class="card-title mb-4 text-2xl">Stuk bewerken</h1>

		<form
			method="POST"
			action="?/slaStukOp"
			use:enhance={() => {
				// Na opslaan: toon kort een bevestiging
				return async ({ update }) => {
					await update();
					stukOpgeslagen = true;
					setTimeout(() => (stukOpgeslagen = false), 2000);
				};
			}}
			class="space-y-3"
		>
			<!-- Naam (verplicht) -->
			<label class="form-control w-full">
				<span class="label-text mb-1 block font-medium">Naam *</span>
				<input
					type="text"
					name="naam"
					bind:value={naam}
					required
					class="input input-bordered w-full"
					placeholder="Naam van het stuk"
				/>
			</label>

			<!-- Toonsoort (optioneel) -->
			<label class="form-control w-full">
				<span class="label-text mb-1 block font-medium">Toonsoort</span>
				<input
					type="text"
					name="toonsoort"
					bind:value={toonsoort}
					class="input input-bordered w-full"
					placeholder="bijv. C majeur, a mineur"
				/>
			</label>

			<!-- Notities (optioneel, meerdere regels) -->
			<label class="form-control w-full">
				<span class="label-text mb-1 block font-medium">Notities</span>
				<textarea
					name="info"
					bind:value={info}
					class="textarea textarea-bordered w-full"
					rows="3"
					placeholder="Vrije notities over dit stuk"
				></textarea>
			</label>

			<!-- Prioriteit (checkbox) -->
			<label class="flex cursor-pointer items-center gap-3">
				<input type="checkbox" name="top_prio" bind:checked={topPrio} class="checkbox" />
				<span class="label-text font-medium">Hoge prioriteit (bovenaan de lijst)</span>
			</label>

			<!-- Knoppen: opslaan en verwijderen -->
			<div class="flex gap-2 pt-2">
				<button type="submit" class="btn btn-primary">
					{stukOpgeslagen ? '✓ Opgeslagen' : 'Opslaan'}
				</button>

				<button
					type="button"
					class="btn btn-error btn-outline"
					onclick={() => {
						if (confirm('Weet je zeker dat je dit stuk wilt verwijderen? Alle bronnen worden ook verwijderd.')) {
							// Stuur het verwijderformulier in via JavaScript
							const form = document.createElement('form');
							form.method = 'POST';
							form.action = '?/verwijderStuk';
							document.body.appendChild(form);
							form.submit();
						}
					}}
				>
					Stuk verwijderen
				</button>
			</div>
		</form>

		<!-- Verborgen formulier voor stuk verwijderen (wordt via JavaScript ingestuurd) -->
		<form method="POST" action="?/verwijderStuk" id="verwijder-stuk-form" class="hidden">
		</form>
	</div>

	<!-- ─── Bronnen ───────────────────────────────────────────────────────── -->
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-xl font-bold">Bronnen</h2>

		<!-- Knop om een nieuwe bron toe te voegen -->
		<form method="POST" action="?/nieuweBron" use:enhance>
			<button type="submit" class="btn btn-secondary btn-sm">+ Nieuwe bron</button>
		</form>
	</div>

	{#if bronnen.length === 0}
		<p class="text-base-content/50 py-4 text-center">Nog geen bronnen. Voeg er een toe!</p>
	{:else}
		<!-- Drag-and-drop lijst van bronnen -->
		<!-- dndzone is de Svelte-actie die drag-and-drop mogelijk maakt -->
		<ul
			use:dndzone={{ items: bronnen, type: 'bronnen' }}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
			class="space-y-4"
		>
			{#each bronnen as bron (bron.id)}
				<li class="card bg-base-100 border p-4">
					<!-- Sleephandvat en bronformulier -->
					<div class="mb-3 flex items-center gap-2">
						<!-- Sleephandvat (cursor geeft aan dat je kunt slepen) -->
						<span class="cursor-grab text-gray-400 select-none" title="Versleep om volgorde te wijzigen">⠿</span>

						<span class="font-medium text-sm text-gray-500">Bron</span>
					</div>

					<!-- Formulier voor bron bewerken -->
					<form method="POST" action="?/slaBronOp" use:enhance class="space-y-3">
						<input type="hidden" name="id" value={bron.id} />

						<!-- Naam (verplicht) -->
						<label class="form-control w-full">
							<span class="label-text mb-1 block text-sm font-medium">Naam *</span>
							<input
								type="text"
								name="naam"
								value={bron.naam}
								required
								class="input input-bordered input-sm w-full"
								placeholder="Naam van de bron"
							/>
						</label>

						<!-- Toonsoort (optioneel) -->
						<label class="form-control w-full">
							<span class="label-text mb-1 block text-sm font-medium">Toonsoort</span>
							<input
								type="text"
								name="toonsoort"
								value={bron.toonsoort ?? ''}
								class="input input-bordered input-sm w-full"
								placeholder="bijv. G majeur (als anders dan het stuk)"
							/>
						</label>

						<!-- Notities (optioneel) -->
						<label class="form-control w-full">
							<span class="label-text mb-1 block text-sm font-medium">Notities</span>
							<textarea
								name="info"
								class="textarea textarea-bordered textarea-sm w-full"
								rows="2"
								placeholder="Vrije notities"
							>{bron.info ?? ''}</textarea>
						</label>

						<!-- Link (optioneel) -->
						<label class="form-control w-full">
							<span class="label-text mb-1 block text-sm font-medium">Link</span>
							<input
								type="url"
								name="link"
								value={bron.link ?? ''}
								class="input input-bordered input-sm w-full"
								placeholder="https://youtube.com/... of https://open.spotify.com/..."
							/>
						</label>

						<div class="flex gap-2">
							<button type="submit" class="btn btn-primary btn-sm">Opslaan</button>

							<!-- Verwijderknop voor deze bron -->
							<button
								type="button"
								class="btn btn-error btn-outline btn-sm"
								onclick={() => (teVerwijderenBronId = bron.id)}
							>
								Verwijderen
							</button>
						</div>
					</form>

					<!-- Link-embed: toont YouTube, Spotify, of een gewone link -->
					{#if bron.link}
						{@const linkInfo = detecteerLink(bron.link)}
						<div class="mt-3">
							{#if linkInfo.type === 'youtube'}
								<!-- YouTube embed als iframe -->
								<iframe
									src={linkInfo.embedUrl}
									title="YouTube video"
									class="aspect-video w-full rounded"
									allowfullscreen
									loading="lazy"
								></iframe>
							{:else if linkInfo.type === 'spotify'}
								<!-- Spotify embed als compact iframe (80px hoog) -->
								<iframe
									src={linkInfo.embedUrl}
									title="Spotify track"
									width="100%"
									height="80"
									class="rounded"
									allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
									loading="lazy"
								></iframe>
							{:else if linkInfo.type === 'url'}
								<!-- Gewone link -->
								<a href={linkInfo.url} target="_blank" rel="noopener noreferrer" class="link link-primary text-sm">
									🔗 {linkInfo.url}
								</a>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<!-- Bevestigingsdialoog voor bron verwijderen -->
{#if teVerwijderenBronId !== null}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="text-lg font-bold">Bron verwijderen</h3>
			<p class="py-4">
				Weet je zeker dat je deze bron wilt verwijderen? Dit kan niet ongedaan gemaakt worden.
			</p>
			<div class="modal-action">
				<button class="btn" onclick={() => (teVerwijderenBronId = null)}>Annuleren</button>

				<form method="POST" action="?/verwijderBron" use:enhance>
					<input type="hidden" name="id" value={teVerwijderenBronId} />
					<button
						type="submit"
						class="btn btn-error"
						onclick={() => (teVerwijderenBronId = null)}
					>
						Verwijderen
					</button>
				</form>
			</div>
		</div>
		<button
			class="modal-backdrop"
			onclick={() => (teVerwijderenBronId = null)}
			aria-label="Dialoog sluiten"
		></button>
	</div>
{/if}
