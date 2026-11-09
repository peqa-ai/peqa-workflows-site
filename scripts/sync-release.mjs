#!/usr/bin/env node
// Runs before `astro dev` and `astro build` (npm predev/prebuild). It downloads README.md of the
// latest peqa-workflows release and writes the docs pages and the landing data. Any failure
// stops the build: the site never falls back to stale or invented content.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGithub } from './lib/github.mjs';
import { buildSite } from './lib/readme.mjs';

const REPO = 'peqa-ai/peqa-workflows';
const EDIT_URL = `https://github.com/${REPO}/edit/main/README.md`;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_DIR = join(root, 'src/content/docs/docs');
const DATA_FILE = join(root, 'src/generated/release.json');

async function main() {
	const github = createGithub({ token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN });
	const release = await github.latestRelease(REPO);
	const [readme, paths] = await Promise.all([github.readme(REPO, release.tag), github.paths(REPO, release.tag)]);

	const site = buildSite({ readme, release, repo: REPO, paths, editUrl: EDIT_URL, introLabel: 'Introducción' });

	// Everything is computed before touching the disk, so a failure leaves no half-written pages.
	await rm(DOCS_DIR, { recursive: true, force: true });
	await mkdir(DOCS_DIR, { recursive: true });
	await Promise.all(site.pages.map((page) => writeFile(join(DOCS_DIR, page.file), page.content)));
	await mkdir(dirname(DATA_FILE), { recursive: true });
	await writeFile(DATA_FILE, `${JSON.stringify(site.data, null, '\t')}\n`);

	for (const warning of site.warnings) console.warn(`sync-release: aviso: ${warning}`);
	console.log(
		`sync-release: ${REPO}@${release.tag} (${release.publishedAt}): ${site.pages.length} páginas, ` +
			`${site.data.skills.length} skills, comandos de Claude Code y Codex.`,
	);
}

main().catch((error) => {
	console.error(`sync-release: error: ${error.message}`);
	process.exitCode = 1;
});
