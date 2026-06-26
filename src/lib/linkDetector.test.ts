// src/lib/linkDetector.test.ts
// Unit tests voor de link-detectie logica.
//
// We testen alle vier de gevallen: YouTube, Spotify, gewone URL, en geen URL.
// Vitest-syntax: 'describe' groepeert tests, 'it' definieert een individuele test,
// 'expect' controleert het resultaat.

import { describe, it, expect } from 'vitest';
import { detecteerLink } from './linkDetector';

describe('detecteerLink', () => {
	// ─── YouTube ─────────────────────────────────────────────────────────────

	it('herkent een standaard YouTube-URL (watch?v=)', () => {
		const result = detecteerLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		expect(result.type).toBe('youtube');
		expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
	});

	it('herkent een YouTube-URL met extra parameters (&t=30)', () => {
		const result = detecteerLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30');
		expect(result.type).toBe('youtube');
		expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
	});

	it('herkent een verkorte YouTube-URL (youtu.be)', () => {
		const result = detecteerLink('https://youtu.be/dQw4w9WgXcQ');
		expect(result.type).toBe('youtube');
		expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
	});

	// ─── Spotify ─────────────────────────────────────────────────────────────

	it('herkent een Spotify track-URL', () => {
		const result = detecteerLink('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC');
		expect(result.type).toBe('spotify');
		expect(result.embedUrl).toBe('https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC');
	});

	// ─── Gewone URL ──────────────────────────────────────────────────────────

	it('herkent een gewone URL', () => {
		const result = detecteerLink('https://www.imslp.org/wiki/some-page');
		expect(result.type).toBe('url');
		expect(result.url).toBe('https://www.imslp.org/wiki/some-page');
	});

	// ─── Geen URL ────────────────────────────────────────────────────────────

	it('geeft "geen" terug voor een lege string', () => {
		const result = detecteerLink('');
		expect(result.type).toBe('geen');
	});

	it('geeft "geen" terug voor null', () => {
		const result = detecteerLink(null);
		expect(result.type).toBe('geen');
	});

	it('geeft "geen" terug voor een string met alleen spaties', () => {
		const result = detecteerLink('   ');
		expect(result.type).toBe('geen');
	});
});
