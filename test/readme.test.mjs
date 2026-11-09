import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import {
	assertSafeMarkdown,
	buildAnchorMap,
	buildSite,
	escapeDestination,
	isSafeUrl,
	parseMarkdown,
	extractInstall,
	extractSkills,
	resolveUrl,
	rewriteLinks,
	splitReadme,
	SyncError,
	unquote,
} from '../scripts/lib/readme.mjs';

const fixture = (name) => new URL(`./fixtures/${name}`, import.meta.url);
const README = readFileSync(fixture('README-v0.17.0.md'), 'utf8');
const PATHS = new Map(JSON.parse(readFileSync(fixture('tree-v0.17.0.json'), 'utf8')).map((entry) => [entry.path, entry.type]));
const REPO = 'peqa-ai/peqa-workflows';
const TAG = 'v0.17.0';
const RELEASE = {
	tag: TAG,
	name: 'v0.17.0 — Aprobar notas y decidir el merge de memoria',
	publishedAt: '2026-11-08T02:18:01Z',
	url: `https://github.com/${REPO}/releases/tag/${TAG}`,
};
const blob = (path) => `https://github.com/${REPO}/blob/${TAG}/${path}`;

function contextFor(markdown) {
	const { sections } = splitReadme(markdown);
	return { repo: REPO, tag: TAG, anchors: buildAnchorMap(markdown, sections), paths: PATHS };
}

function site() {
	return buildSite({
		readme: README,
		release: RELEASE,
		repo: REPO,
		paths: PATHS,
		editUrl: `https://github.com/${REPO}/edit/main/README.md`,
		introLabel: 'Introducción',
	});
}

describe('splitReadme', () => {
	test('keeps the intro, without the title, and one section per ## in README order', () => {
		const { title, intro, sections } = splitReadme(README);
		assert.equal(title, 'PEQA workflows');
		assert.ok(intro.startsWith('Seis skills para decidir'));
		assert.ok(intro.endsWith('[Licencia MIT](LICENSE)'));
		assert.ok(!intro.includes('# PEQA workflows'));
		assert.deepEqual(
			sections.map((section) => section.title),
			[
				'Cómo se reparte el trabajo',
				'Qué le puedes pedir',
				'Diseño de interfaces',
				'Evidencia visual',
				'Limpieza al terminar',
				'Varios servicios con Git submodules',
				'Memoria entre sesiones',
				'Validación y hooks opcionales',
				'Instalar',
				'Requisitos y validación',
				'Licencia',
				'Contribuir',
				'Fuentes',
			],
		);
	});

	test('gives each page an ASCII slug', () => {
		const slugs = splitReadme(README).sections.map((section) => section.slug);
		assert.deepEqual(slugs.slice(0, 3), ['como-se-reparte-el-trabajo', 'que-le-puedes-pedir', 'diseno-de-interfaces']);
		assert.ok(slugs.every((slug) => /^[a-z0-9-]+$/.test(slug)));
	});

	test('a section keeps its body without its heading, Mermaid block included', () => {
		const section = splitReadme(README).sections[0];
		assert.ok(section.body.startsWith('`dirige` mantiene al agente padre'));
		assert.ok(section.body.includes('```mermaid\nflowchart TD\n    accTitle: Coordinación de una implementación con PEQA'));
		assert.ok(!section.body.includes('## Qué le puedes pedir'));
	});

	test('does not split on ## inside a code block', () => {
		const markdown = '# T\n\nIntro\n\n## Uno\n\n```md\n## No es sección\n```\n\n## Dos\n\nTexto\n';
		const { sections } = splitReadme(markdown);
		assert.deepEqual(sections.map((section) => section.title), ['Uno', 'Dos']);
		assert.ok(sections[0].body.includes('## No es sección'));
	});

	test('fails without a title or sections', () => {
		assert.throws(() => splitReadme('## Uno\n'), SyncError);
		assert.throws(() => splitReadme('# T\n\nSolo intro\n'), SyncError);
	});
});

describe('anchors', () => {
	test('README anchors resolve to the page that owns the heading', () => {
		const { anchors } = contextFor(README);
		assert.deepEqual(anchors.get('memoria-entre-sesiones'), { page: 'memoria-entre-sesiones', hash: null });
		assert.deepEqual(anchors.get('diseño-de-interfaces'), { page: 'diseno-de-interfaces', hash: null });
		assert.deepEqual(anchors.get('peqa-workflows'), { page: null, hash: null });
	});

	test('deeper headings keep an anchor slugged per page, as Astro does', () => {
		const markdown = '# T\n\n## Uno\n\n### Detalle\n\n## Dos\n\n### Detalle\n\n### Detalle\n';
		const { anchors } = contextFor(markdown);
		assert.deepEqual(anchors.get('detalle'), { page: 'uno', hash: 'detalle' });
		assert.deepEqual(anchors.get('detalle-1'), { page: 'dos', hash: 'detalle' });
		assert.deepEqual(anchors.get('detalle-2'), { page: 'dos', hash: 'detalle-1' });
	});
});

describe('resolveUrl and rewriteLinks', () => {
	const context = contextFor(README);

	test('#anchor and README.md#anchor point to the generated page', () => {
		assert.equal(resolveUrl('#memoria-entre-sesiones', context).url, '/docs/memoria-entre-sesiones/');
		assert.equal(resolveUrl('#diseño-de-interfaces', context).url, '/docs/diseno-de-interfaces/');
		assert.equal(resolveUrl('#dise%C3%B1o-de-interfaces', context).url, '/docs/diseno-de-interfaces/');
		assert.equal(resolveUrl('README.md#instalar', context).url, '/docs/instalar/');
		assert.equal(resolveUrl('./README.md', context).url, '/docs/');
	});

	test('an anchor no heading generates fails the sync', () => {
		assert.throws(() => resolveUrl('#no-existe', context), /no-existe/);
	});

	test('repo files go to GitHub at the tag, directories to tree/', () => {
		assert.equal(resolveUrl('LICENSE', context).url, blob('LICENSE'));
		assert.equal(resolveUrl('skills/revisa/references/validation.md', context).url, blob('skills/revisa/references/validation.md'));
		assert.equal(resolveUrl('skills/ui-design/references/native.md#fuentes', context).url, `${blob('skills/ui-design/references/native.md')}#fuentes`);
		assert.equal(resolveUrl('./tests/ui-design-scenarios.md', context).url, blob('tests/ui-design-scenarios.md'));
		assert.equal(resolveUrl('skills/dirige', context).url, `https://github.com/${REPO}/tree/${TAG}/skills/dirige`);
		assert.equal(resolveUrl('references/', context).url, `https://github.com/${REPO}/tree/${TAG}/references`);
	});

	test('images go to raw.githubusercontent.com at the tag', () => {
		assert.equal(resolveUrl('docs/flujo.png', { ...context, kind: 'image' }).url, `https://raw.githubusercontent.com/${REPO}/${TAG}/docs/flujo.png`);
	});

	test('absolute URLs stay as written; missing files warn; leaving the repo fails', () => {
		assert.equal(resolveUrl('https://peqa.ai', context).url, 'https://peqa.ai');
		assert.equal(resolveUrl('mailto:hola@peqa.ai', context).url, 'mailto:hola@peqa.ai');
		assert.match(resolveUrl('no/existe.md', context).warning, /no existe/);
		assert.throws(() => resolveUrl('../fuera.md', context), SyncError);
	});

	test('rewrites every destination in the README and nothing else', () => {
		const { markdown, warnings } = rewriteLinks(README, context);
		assert.deepEqual(warnings, []);
		assert.ok(markdown.includes('[memoria](/docs/memoria-entre-sesiones/)'));
		assert.ok(markdown.includes('[diseño de interfaces](/docs/diseno-de-interfaces/)'));
		assert.ok(markdown.includes('[evidencia visual](/docs/evidencia-visual/)'));
		assert.ok(markdown.includes(`[Licencia MIT](${blob('LICENSE')})`));
		assert.ok(markdown.includes(`[dirige](${blob('skills/dirige/SKILL.md')})`));
		assert.ok(markdown.includes(`[las comprobaciones](${blob('skills/ui-design/references/design-system.md')}#comprobaciones)`));
		assert.ok(markdown.includes('[Matt Pocock](https://github.com/mattpocock/skills)'));
		assert.ok(!/\]\((?!https:\/\/|\/docs\/)/.test(markdown), 'no relative destination is left');
		// Outside the destinations, the text is unchanged: same lines, same code blocks.
		const strip = (text) => text.replace(/\]\([^)]*\)/g, ']()');
		assert.equal(strip(markdown), strip(README));
	});

	test('leaves code spans and code blocks alone; handles images, titles, definitions and HTML', () => {
		const markdown = [
			'# T',
			'',
			'## Uno',
			'',
			'Ver `[no](LICENSE)` y [sí](LICENSE "Licencia") y ![Diagrama](docs/a.png).',
			'',
			'```md',
			'[tampoco](LICENSE)',
			'```',
			'',
			'[ref][licencia] y <a href="skills/dirige">dirige</a>',
			'',
			'[licencia]: LICENSE',
			'',
		].join('\n');
		const { markdown: output } = rewriteLinks(markdown, contextFor(markdown));
		assert.ok(output.includes('`[no](LICENSE)`'));
		assert.ok(output.includes('[tampoco](LICENSE)'));
		assert.ok(output.includes(`[sí](${blob('LICENSE')} "Licencia")`));
		assert.ok(output.includes(`![Diagrama](https://raw.githubusercontent.com/${REPO}/${TAG}/docs/a.png)`));
		assert.ok(output.includes(`[licencia]: ${blob('LICENSE')}`));
		assert.ok(output.includes(`<a href="https://github.com/${REPO}/tree/${TAG}/skills/dirige">`));
	});
});

describe('extractInstall', () => {
	test('reads both ```sh blocks of ## Instalar byte for byte', () => {
		const install = extractInstall(README);
		assert.equal(install.claudeCode.command, 'claude plugin marketplace add peqa-ai/peqa-workflows\nclaude plugin install peqa-workflows@peqa --scope user');
		assert.equal(install.codex.command, 'codex plugin marketplace add peqa-ai/peqa-workflows\ncodex plugin add peqa-workflows@peqa');
		assert.equal(install.codex.label, 'Codex CLI con soporte para plugins');
		for (const { command } of Object.values(install)) assert.ok(README.includes(`\`\`\`sh\n${command}\n\`\`\``));
	});

	test('reads how to invoke the skills in each client', () => {
		const install = extractInstall(README);
		assert.equal(install.claudeCode.invoke, '/peqa-workflows:dirige');
		assert.equal(install.codex.invoke, '$peqa-workflows:dirige');
	});

	test('fails loudly instead of inventing commands', () => {
		assert.throws(() => extractInstall(README.replace('## Instalar', '## Instalación')), /## Instalar/);
		assert.throws(() => extractInstall(README.replace('**Codex CLI con soporte para plugins**', 'Codex')), /\*\*Codex\*\*/);
		assert.throws(() => extractInstall(README.replace('```sh\ncodex plugin', '```bash\ncodex plugin')), /```sh/);
		assert.throws(() => extractInstall(README.replace('- Codex: `$peqa-workflows:dirige`.', '- Codex.')), /invocar/);
	});

	test('fails on an empty install block or an empty line inside it', () => {
		const claude = 'claude plugin marketplace add peqa-ai/peqa-workflows\nclaude plugin install peqa-workflows@peqa --scope user';
		assert.throws(() => extractInstall(README.replace(claude, '')), /vacío/);
		assert.throws(() => extractInstall(README.replace(claude, '   ')), /vacío/);
		assert.throws(() => extractInstall(README.replace(claude, claude.replace('\n', '\n\n'))), /vacío/);
	});
});

describe('assertSafeMarkdown', () => {
	const page = (body) => `# T\n\n${body}\n`;

	test('accepts the release README and documentation HTML', () => {
		assert.doesNotThrow(() => assertSafeMarkdown(README));
		assert.doesNotThrow(() => assertSafeMarkdown(page('<details open><summary>Más</summary>\n\nTexto [enlace](https://x.dev) y <a href="#ancla">ancla</a>.\n\n</details>')));
	});

	test('rejects scripts, event handlers, unknown elements and script URLs, however written', () => {
		for (const bad of [
			'<script>globalThis.__readmeProbe = 1</script>',
			'<img src="x.png" onerror="alert(1)">',
			'<a href="#" onclick="alert(1)">x</a>',
			'<svg onload="alert(1)"></svg>',
			'<iframe src="https://example.com"></iframe>',
			'<style>body { display: none }</style>',
			'<a href="javascript:alert(1)">x</a>',
			'<a href="&#106;avascript:alert(1)">x</a>',
			'<img src="data:image/svg+xml,<svg onload=alert(1)>">',
			'[x](javascript:alert(1))',
			'[x][ref]\n\n[ref]: vbscript:msgbox(1)',
		]) {
			assert.throws(() => assertSafeMarkdown(page(bad)), SyncError, bad);
		}
	});

	test('reads protocols as a browser does: tabs, line breaks, case and spacing', () => {
		for (const url of ['java\tscript:alert(1)', 'java\nscript:alert(1)', 'java\rscript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,x', 'vbscript:x']) {
			assert.equal(isSafeUrl(url), false, JSON.stringify(url));
		}
		for (const url of ['https://x.dev/a b', '/docs/', 'skills/dirige/SKILL.md#x', '#ancla', 'mailto:a@b.c', '//x.dev']) {
			assert.equal(isSafeUrl(url), true, JSON.stringify(url));
		}
		for (const bad of [
			'<a href=java&#x09;script:alert(1)>x</a>',
			'<a href="java&#10;script:alert(1)">x</a>',
			'<a HREF = "java&#13;script:alert(1)">x</a>',
			'| a |\n| - |\n| <a href=java&#x09;script:alert(1)>x</a> |',
			'- <a href=java&#x09;script:alert(1)>x</a>',
			'[x](java&#9;script:alert(1))',
		]) {
			assert.throws(() => assertSafeMarkdown(page(bad)), SyncError, bad);
		}
	});

	test('rewriting never turns an accepted destination into markup', () => {
		const payloads = [
			'[x](https://example.com/&#60;img&#32;src=x&#32;onerror=alert&#40;1&#41;&#62;)',
			'[x](skills/dirige/SKILL.md#&#60;img&#32;src=x&#32;onerror=alert&#40;1&#41;&#62;)',
			'[x](skills/&#60;img&#32;src=x&#32;onerror=alert&#40;1&#41;&#62;)',
			'![i](docs/&#60;img&#32;src=x&#32;onerror=alert&#40;1&#41;&#62;.png)',
			'[x][r]\n\n[r]: skills/dirige/SKILL.md#&#60;script&#62;x&#60;/script&#62;',
			'<a href="skills/dirige/SKILL.md#&#34;&#62;&#60;img src=x onerror=alert(1)&#62;">x</a>',
		];
		for (const payload of payloads) {
			const { pages } = buildSite({ readme: `${README}\n\n## Prueba\n\n${payload}\n`, release: RELEASE, repo: REPO, paths: PATHS, editUrl: '', introLabel: 'Introducción' });
			const body = pages.find((entry) => entry.slug === 'prueba').content.replace(/^---\n[\s\S]*?\n---\n/, '');
			const htmlNodes = [];
			const visit = (node) => {
				if (node.type === 'html') htmlNodes.push(node.value);
				for (const child of node.children ?? []) visit(child);
			};
			visit(parseMarkdown(body));
			const allowed = payload.startsWith('<a ') ? ['</a>'] : [];
			assert.deepEqual(htmlNodes.filter((value) => !value.startsWith('<a href="https://github.com/')), allowed, payload);
		}
	});

	test('escapes what could close a destination or start markup', () => {
		assert.equal(escapeDestination('a b<c>"d\'e(f)`g'), 'a%20b%3Cc%3E%22d%27e%28f%29%60g');
		assert.equal(escapeDestination('x&#60;y&amp;z?a=1&b=2'), 'x%26#60;y%26amp;z?a=1&b=2');
	});

	test('stops buildSite before any page is generated', () => {
		assert.throws(
			() => buildSite({ readme: `${README}\n<script>x()</script>\n`, release: RELEASE, repo: REPO, paths: PATHS, editUrl: '', introLabel: 'Introducción' }),
			/<script>/,
		);
	});
});

describe('extractSkills', () => {
	test('reads the six skills, their links and example requests in table order', () => {
		const skills = extractSkills(README, contextFor(README));
		assert.deepEqual(
			skills.map((skill) => skill.name),
			['dirige', 'idea', 'ui-design', 'revisa', 'memoria-guardar', 'memoria-extraer'],
		);
		assert.deepEqual(skills[0], {
			name: 'dirige',
			url: blob('skills/dirige/SKILL.md'),
			example: 'Implementa este cambio y coordina a los agentes',
		});
		assert.equal(skills[5].example, 'Recupera lo que sabemos de DevOps en este proyecto');
	});

	test('unquote removes quotes and the final period only', () => {
		assert.equal(unquote('"Guarda cómo desplegamos este servicio".'), 'Guarda cómo desplegamos este servicio');
		assert.equal(unquote('«Hola, mundo»'), 'Hola, mundo');
		assert.equal(unquote('Sin comillas.'), 'Sin comillas.');
	});
});

describe('buildSite', () => {
	test('writes the index first and one page per section with frontmatter and order', () => {
		const { pages } = site();
		assert.equal(pages.length, 14);
		assert.equal(pages[0].file, 'index.md');
		assert.match(pages[0].content, /^---\n# Generado por scripts\/sync-release\.mjs desde README\.md de peqa-ai\/peqa-workflows@v0\.17\.0\. No editar\.\ntitle: "PEQA workflows"\n/);
		assert.match(pages[0].content, /sidebar:\n {2}order: 0\n {2}label: "Introducción"/);
		const work = pages.find((page) => page.slug === 'como-se-reparte-el-trabajo');
		assert.match(work.content, /title: "Cómo se reparte el trabajo"/);
		assert.match(work.content, /editUrl: "https:\/\/github.com\/peqa-ai\/peqa-workflows\/edit\/main\/README.md"/);
		assert.match(work.content, /sidebar:\n {2}order: 1\n/);
		assert.match(work.content, /description: "`?dirige`? mantiene al agente padre a cargo de la entrega\."/);
		assert.match(work.content, /tableOfContents: false/);
		assert.ok(work.content.includes('```mermaid'));
	});

	test('collects release metadata, install commands, skills and docs links for the landing', () => {
		const { data, warnings } = site();
		assert.deepEqual(warnings, []);
		assert.deepEqual(data.release, { ...RELEASE, version: '0.17.0' });
		assert.equal(data.skills.length, 6);
		assert.equal(data.docs[0].url, '/docs/');
		assert.equal(data.docs[1].url, '/docs/como-se-reparte-el-trabajo/');
	});
});
