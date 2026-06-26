<!--
  src/routes/+page.svelte
  Hoofdpagina van De Sprong.

  Toont twee tabs (Songs en Oefenmateriaal) met de bijbehorende stukken.
  Elk stuk heeft een knop om naar de detailpagina te navigeren en een knop om te verwijderen.
  Onderaan elke tab staat een knop om een nieuw stuk toe te voegen.

  'data' komt van +page.server.ts (de 'load' functie).
  Formulieren gebruiken SvelteKit 'enhance' voor snelle, JavaScript-vrije verzending.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';

	// De data die door de server is geladen (categorieën + stukken)
	let { data }: { data: PageData } = $props();

	// Bijhouden welke tab actief is: we slaan de categorie_id op.
	// untrack: beginwaarde eenmalig lezen zodat de gebruiker van tab kan wisselen
	// zonder dat Svelte de waarde terugzet naar de server-data.
	let actieveTabId = $state(untrack(() => data.categorieen[0]?.id ?? 0));

	// De stukken van de actieve tab
	const actieveCategorie = $derived(data.categorieen.find((c) => c.id === actieveTabId));

	// Bijhouden welk stuk bevestigd moet worden voor verwijdering
	let teVerwijderenId = $state<number | null>(null);
</script>

<svelte:head>
	<title>De Sprong</title>
</svelte:head>

<div class="container mx-auto max-w-2xl p-4">
	<!-- Paginatitel -->
	<h1 class="mb-6 text-3xl font-bold">De Sprong</h1>

	<!-- Tabs: één tab per categorie -->
	<div role="tablist" class="tabs tabs-bordered mb-4">
		{#each data.categorieen as categorie}
			<button
				role="tab"
				class="tab {actieveTabId === categorie.id ? 'tab-active' : ''}"
				onclick={() => (actieveTabId = categorie.id)}
			>
				{categorie.naam}
			</button>
		{/each}
	</div>

	<!-- Lijst van stukken voor de actieve tab -->
	{#if actieveCategorie}
		<ul class="space-y-2">
			{#each actieveCategorie.stukken as stuk}
				<li class="flex items-center gap-2 rounded-lg border p-3">
					<!-- Visuele indicator voor top prioriteit -->
					{#if stuk.top_prio}
						<span class="badge badge-warning badge-sm" title="Hoge prioriteit">★</span>
					{/if}

					<!-- Naam en toonsoort: klik om naar detailpagina te gaan -->
					<a href="/stuk/{stuk.id}" class="flex-1 hover:underline">
						<span class="font-medium">{stuk.naam}</span>
						{#if stuk.toonsoort}
							<span class="text-base-content/60 ml-2 text-sm">{stuk.toonsoort}</span>
						{/if}
					</a>

					<!-- Verwijderknop: vraagt eerst om bevestiging -->
					<button
						class="btn btn-ghost btn-sm text-error"
						onclick={() => (teVerwijderenId = stuk.id)}
						title="Stuk verwijderen"
					>
						✕
					</button>
				</li>
			{:else}
				<!-- Lege staat: geen stukken in deze categorie -->
				<li class="text-base-content/50 py-4 text-center">
					Nog geen stukken in deze categorie.
				</li>
			{/each}
		</ul>

		<!-- Knop om een nieuw stuk toe te voegen -->
		<form method="POST" action="?/nieuwStuk" use:enhance class="mt-4">
			<input type="hidden" name="categorie_id" value={actieveCategorie.id} />
			<button type="submit" class="btn btn-primary w-full">+ Nieuw stuk</button>
		</form>
	{/if}
</div>

<!-- Bevestigingsdialoog voor verwijderen -->
<!-- Dialoog is alleen zichtbaar als teVerwijderenId ingesteld is -->
{#if teVerwijderenId !== null}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="text-lg font-bold">Stuk verwijderen</h3>
			<p class="py-4">
				Weet je zeker dat je dit stuk wilt verwijderen? Alle bijbehorende bronnen worden ook verwijderd.
				Deze actie kan niet ongedaan gemaakt worden.
			</p>
			<div class="modal-action">
				<!-- Annuleerknop: sluit de dialoog zonder te verwijderen -->
				<button class="btn" onclick={() => (teVerwijderenId = null)}>Annuleren</button>

				<!-- Bevestigingsknop: stuurt het verwijderformulier in -->
				<form method="POST" action="?/verwijderStuk" use:enhance>
					<input type="hidden" name="id" value={teVerwijderenId} />
					<button
						type="submit"
						class="btn btn-error"
						onclick={() => (teVerwijderenId = null)}
					>
						Verwijderen
					</button>
				</form>
			</div>
		</div>
		<!-- Klik buiten de dialoog om te annuleren -->
		<button
			class="modal-backdrop"
			onclick={() => (teVerwijderenId = null)}
			aria-label="Dialoog sluiten"
		></button>
	</div>
{/if}

