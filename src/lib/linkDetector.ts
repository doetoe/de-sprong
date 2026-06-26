// src/lib/linkDetector.ts
// Hulpfuncties voor het detecteren en verwerken van links in bronnen.
//
// Een link kan zijn:
//   - Een YouTube-URL → omzetten naar een embed-URL voor een iframe
//   - Een Spotify-track-URL → omzetten naar een embed-URL voor een compact iframe
//   - Een gewone URL → tonen als klikbare link
//   - Leeg → niets tonen
//
// Deze logica draait client-side (in de browser), niet op de server.
// Daarom staat dit bestand in src/lib/ en niet in src/lib/server/.

// De drie soorten links die we herkennen
export type LinkType = 'youtube' | 'spotify' | 'url' | 'geen';

export type LinkInfo = {
	type: LinkType;
	embedUrl?: string; // Alleen ingevuld voor youtube en spotify
	url?: string;      // Alleen ingevuld voor gewone links
};

// Detecteert het type van een link en geeft de bijbehorende informatie terug.
// Voorbeeld:
//   detecteerLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
//   → { type: 'youtube', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
export function detecteerLink(link: string | null): LinkInfo {
	// Geen link opgegeven
	if (!link || link.trim() === '') {
		return { type: 'geen' };
	}

	const url = link.trim();

	// Controleer op YouTube
	// Twee vormen:
	//   - https://www.youtube.com/watch?v=VIDEO_ID
	//   - https://youtu.be/VIDEO_ID
	const youtubeId = haalYoutubeIdOp(url);
	if (youtubeId) {
		return {
			type: 'youtube',
			embedUrl: `https://www.youtube.com/embed/${youtubeId}`
		};
	}

	// Controleer op Spotify track
	// Vorm: https://open.spotify.com/track/TRACK_ID
	const spotifyId = haalSpotifyIdOp(url);
	if (spotifyId) {
		return {
			type: 'spotify',
			embedUrl: `https://open.spotify.com/embed/track/${spotifyId}`
		};
	}

	// Alle overige URLs tonen als klikbare link
	return { type: 'url', url };
}

// Haalt het video-id op uit een YouTube-URL.
// Geeft null terug als de URL geen YouTube-link is.
function haalYoutubeIdOp(url: string): string | null {
	// Vorm 1: youtube.com/watch?v=ID (ook met extra parameters zoals &t=30)
	const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/);
	if (watchMatch) return watchMatch[1];

	// Vorm 2: youtu.be/ID
	const shortMatch = url.match(/(?:youtu\.be\/)([A-Za-z0-9_-]{11})/);
	if (shortMatch) return shortMatch[1];

	return null;
}

// Haalt het track-id op uit een Spotify-URL.
// Geeft null terug als de URL geen Spotify track-link is.
function haalSpotifyIdOp(url: string): string | null {
	const match = url.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
	return match ? match[1] : null;
}
