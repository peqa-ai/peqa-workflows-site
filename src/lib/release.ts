// Release data written by scripts/sync-release.mjs (npm predev/prebuild) from the latest
// peqa-workflows release. The build fails if it is missing: the site never invents it.
import data from '../generated/release.json';

export const release = data;

/** «8 de noviembre de 2026» / «November 8, 2026», the UTC date GitHub records. */
export function formatDate(iso: string, lang: string) {
	return new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
}
