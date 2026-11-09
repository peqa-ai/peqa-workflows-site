// Reads the latest release of the plugin from the GitHub REST API.
// GITHUB_TOKEN is optional: without it the API allows 60 requests per hour per IP.
import { SyncError } from './readme.mjs';

const API = 'https://api.github.com';

export function createGithub({ token, fetchImpl = globalThis.fetch } = {}) {
	async function request(path, { raw = false } = {}) {
		const headers = {
			Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
			'User-Agent': 'peqa-workflows-site',
			'X-GitHub-Api-Version': '2022-11-28',
		};
		if (token) headers.Authorization = `Bearer ${token}`;
		let response;
		try {
			response = await fetchImpl(`${API}${path}`, { headers, signal: AbortSignal.timeout(30_000) });
		} catch (error) {
			throw new SyncError(`No se pudo consultar GitHub (${path}): ${error.message}`);
		}
		if (!response.ok) {
			const exhausted = response.headers.get('x-ratelimit-remaining') === '0';
			const hint = exhausted ? ' Se agotó el límite de peticiones: define GITHUB_TOKEN.' : '';
			const detail = (await response.text()).slice(0, 300);
			throw new SyncError(`GitHub respondió ${response.status} a ${path}.${hint} ${detail}`.trim());
		}
		return raw ? response.text() : response.json();
	}

	return {
		/** The latest published release (GitHub excludes drafts and prereleases). */
		async latestRelease(repo) {
			const release = await request(`/repos/${repo}/releases/latest`);
			const { tag_name: tag, name, published_at: publishedAt, html_url: url } = release;
			if (!tag || !publishedAt || !url) {
				throw new SyncError(`La última release de ${repo} no trae tag, fecha de publicación o URL.`);
			}
			return { tag, name: name || tag, publishedAt, url };
		},

		/** README.md exactly as committed at the tag. */
		async readme(repo, tag) {
			const text = await request(`/repos/${repo}/contents/README.md?ref=${encodeURIComponent(tag)}`, { raw: true });
			if (!text.trim()) throw new SyncError(`README.md está vacío en ${repo}@${tag}.`);
			return text;
		},

		/** Every path of the repository at the tag, with its type (`blob` or `tree`). */
		async paths(repo, tag) {
			const tree = await request(`/repos/${repo}/git/trees/${encodeURIComponent(tag)}?recursive=1`);
			if (tree.truncated) throw new SyncError(`El árbol de ${repo}@${tag} llegó truncado; no se pueden clasificar sus enlaces.`);
			return new Map(tree.tree.map((entry) => [entry.path, entry.type]));
		},
	};
}
