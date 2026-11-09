// Turns the plugin README of one release into the site's docs pages and landing data.
// Every function here is pure: the network lives in github.mjs and the files in sync-release.mjs.
import { posix } from 'node:path';
import GithubSlugger from 'github-slugger';
import { fromHtml } from 'hast-util-from-html';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { toString } from 'mdast-util-to-string';
import { gfm } from 'micromark-extension-gfm';

/** Where the generated docs pages live in the site. */
export const DOCS_BASE = '/docs/';

/** README sections the landing reads. Renaming them in the README fails the sync on purpose. */
export const INSTALL_SECTION = 'Instalar';
export const SKILLS_SECTION = 'Qué le puedes pedir';

/** An error that explains what in the README or the release has to change. */
export class SyncError extends Error {
	name = 'SyncError';
}

export function parseMarkdown(markdown) {
	return fromMarkdown(markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
}

/** Calls `visitor(node)` for every node, in document order. */
function walk(node, visitor) {
	visitor(node);
	for (const child of node.children ?? []) walk(child, visitor);
}

const isHeading = (node, depth) => node.type === 'heading' && node.depth === depth;

/**
 * Page slug for a README section: GitHub's slug without diacritics, so URLs stay ASCII
 * («Diseño de interfaces» → diseno-de-interfaces).
 */
export function pageSlug(title, slugger = new GithubSlugger()) {
	return slugger.slug(title.normalize('NFD').replace(/\p{M}/gu, ''));
}

/**
 * Splits the README into the intro (everything before the first `## `, without the `# ` title)
 * and one section per top-level `## ` heading, in README order. Headings inside code blocks,
 * lists or quotes do not split.
 */
export function splitReadme(markdown) {
	const tree = parseMarkdown(markdown);
	const title = tree.children.find((node) => isHeading(node, 1));
	if (!title) throw new SyncError('El README no tiene un título «# …».');
	const headings = tree.children.filter((node) => isHeading(node, 2));
	if (headings.length === 0) throw new SyncError('El README no tiene secciones «## …».');

	const firstSection = headings[0].position.start.offset;
	const introText =
		markdown.slice(0, Math.min(title.position.start.offset, firstSection)) +
		(title.position.start.offset < firstSection ? markdown.slice(title.position.end.offset, firstSection) : '');

	const slugger = new GithubSlugger();
	const sections = headings.map((heading, index) => {
		const end = headings[index + 1]?.position.start.offset ?? markdown.length;
		const sectionTitle = toString(heading).trim();
		return {
			title: sectionTitle,
			slug: pageSlug(sectionTitle, slugger),
			start: heading.position.start.offset,
			end,
			body: markdown.slice(heading.position.end.offset, end).trim(),
		};
	});

	return { title: toString(title).trim(), intro: introText.trim(), sections };
}

/**
 * Maps each README anchor, as GitHub writes it, to the page that owns that heading:
 * a `## ` heading becomes its own page, deeper headings keep an anchor on their page.
 * Anchors use github-slugger, the slugger Astro uses for heading ids.
 */
export function buildAnchorMap(markdown, sections) {
	const tree = parseMarkdown(markdown);
	const readmeSlugger = new GithubSlugger();
	const anchors = new Map();
	let pageSlugger = new GithubSlugger();
	let page = null;

	walk(tree, (node) => {
		if (node.type !== 'heading') return;
		const text = toString(node);
		const readmeAnchor = readmeSlugger.slug(text);
		const offset = node.position.start.offset;
		const owner = sections.find((section) => offset >= section.start && offset < section.end);
		if (owner?.start === offset) {
			page = owner.slug;
			pageSlugger = new GithubSlugger();
			anchors.set(readmeAnchor, { page, hash: null });
		} else if (!owner) {
			anchors.set(readmeAnchor, { page: null, hash: node.depth === 1 ? null : pageSlugger.slug(text) });
		} else {
			if (owner.slug !== page) {
				page = owner.slug;
				pageSlugger = new GithubSlugger();
			}
			anchors.set(readmeAnchor, { page, hash: pageSlugger.slug(text) });
		}
	});
	return anchors;
}

export function docsUrl({ page, hash }) {
	return `${DOCS_BASE}${page ? `${page}/` : ''}${hash ? `#${hash}` : ''}`;
}

const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

/**
 * Makes a rewritten destination safe to write back into Markdown or an HTML attribute: the
 * README's destinations arrive decoded (entities included), so anything that could close the
 * destination or start markup is percent-encoded, as is an «&» that would read as an entity.
 */
export function escapeDestination(url) {
	return url
		.replace(/[\u0000-\u0020\u007F<>"'`()\\{}|^]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`)
		.replace(/&(?=#?[a-z0-9]+;)/gi, '%26');
}

/**
 * Resolves one README link or image destination for the site.
 * Returns `{ url, warning? }`; throws a SyncError for anchors that match no heading.
 */
export function resolveUrl(raw, { kind = 'link', repo, tag, anchors, paths }) {
	const url = raw.trim();
	if (url === '' || /^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('//')) return { url: raw };

	const hashIndex = url.indexOf('#');
	const pathPart = hashIndex === -1 ? url : url.slice(0, hashIndex);
	const hash = hashIndex === -1 ? '' : url.slice(hashIndex + 1);

	const cleaned = pathPart.split('?')[0].replace(/^\/+/, '');
	const normalized = cleaned === '' ? '' : posix.normalize(cleaned).replace(/\/$/, '');
	if (normalized === '..' || normalized.startsWith('../')) {
		throw new SyncError(`El enlace «${raw}» del README sale del repositorio.`);
	}

	if (normalized === '' || normalized === '.' || normalized === 'README.md') {
		if (!hash) return { url: DOCS_BASE };
		let anchor = hash;
		try {
			anchor = decodeURIComponent(hash);
		} catch {
			// Keep the anchor as written when it is not valid percent-encoding.
		}
		const target = anchors.get(anchor) ?? anchors.get(anchor.toLowerCase());
		if (!target) {
			throw new SyncError(`El README enlaza a «${raw}», pero ningún encabezado genera el ancla «#${anchor}».`);
		}
		return { url: docsUrl(target) };
	}

	if (kind === 'image') {
		return { url: `https://raw.githubusercontent.com/${repo}/${tag}/${encodePath(normalized)}` };
	}

	const type = paths.get(normalized);
	const suffix = hash ? `#${escapeDestination(hash)}` : '';
	const segment = type === 'tree' || (!type && pathPart.endsWith('/')) ? 'tree' : 'blob';
	const resolved = { url: `https://github.com/${repo}/${segment}/${tag}/${encodePath(normalized)}${suffix}` };
	if (!type) resolved.warning = `El README enlaza a «${raw}», que no existe en ${tag}.`;
	return resolved;
}

/** Finds where a link or image destination is written inside its node's source. */
function destinationRange(source, node) {
	const start = node.position.start.offset;
	const end = node.position.end.offset;
	const text = source.slice(start, end);
	let cursor;
	if (node.type === 'definition') {
		cursor = text.indexOf(']:') + 2;
	} else {
		const lastChild = node.children?.at(-1);
		const labelEnd = lastChild ? lastChild.position.end.offset - start : node.type === 'image' ? 2 : 1;
		const open = text.indexOf('](', labelEnd);
		if (open === -1) return null; // A reference-style link: its definition carries the URL.
		cursor = open + 2;
	}
	while (/\s/.test(text[cursor])) cursor += 1;
	if (text[cursor] === '<') {
		const close = text.indexOf('>', cursor);
		return { start: start + cursor + 1, end: start + close, angle: true };
	}
	let depth = 0;
	let index = cursor;
	for (; index < text.length; index += 1) {
		const char = text[index];
		if (char === '\\') {
			index += 1;
			continue;
		}
		if (/\s/.test(char)) break;
		if (char === '(') depth += 1;
		if (char === ')') {
			if (depth === 0) break;
			depth -= 1;
		}
	}
	return { start: start + cursor, end: start + index, angle: false };
}

/** Backslash-escapes ASCII punctuation, so text written back into Markdown stays plain text. */
const escapeMarkdownText = (text) => text.replace(/[!-/:-@[-`{-~]/g, '\\$&');

/**
 * Rewrites every link, image, definition and HTML href/src of the README for the site,
 * changing only the destinations so the rest of the Markdown stays byte for byte.
 *
 * A reference image (`![alt][ref]`, `![alt][]`, `![alt]`) becomes an inline image with the raw
 * file URL, because its definition is rewritten for links (the GitHub page). HTML attributes
 * are found with the HTML parser, so case, spacing, quoting and entities read as a browser
 * reads them.
 */
export function rewriteLinks(markdown, context) {
	const tree = parseMarkdown(markdown);
	const edits = [];
	const warnings = [];
	const definitions = new Map();
	walk(tree, (node) => {
		if (node.type === 'definition' && !definitions.has(node.identifier)) definitions.set(node.identifier, node);
	});

	walk(tree, (node) => {
		if (node.type === 'link' || node.type === 'image' || node.type === 'definition') {
			const range = destinationRange(markdown, node);
			if (!range) return;
			const kind = node.type === 'image' ? 'image' : 'link';
			const { url, warning } = resolveUrl(node.url, { ...context, kind });
			if (warning) warnings.push(warning);
			// A destination that stays the same keeps its original text, entities included.
			if (url === node.url) return;
			edits.push({ start: range.start, end: range.end, text: escapeDestination(url) });
		} else if (node.type === 'imageReference') {
			const definition = definitions.get(node.identifier);
			if (!definition) return;
			const { url, warning } = resolveUrl(definition.url, { ...context, kind: 'image' });
			if (warning) warnings.push(warning);
			// Same destination as the rewritten definition (absolute URLs, anchors): nothing to do.
			if (url === resolveUrl(definition.url, { ...context, kind: 'link' }).url) return;
			const title = definition.title ? ` "${escapeMarkdownText(definition.title)}"` : '';
			edits.push({
				start: node.position.start.offset,
				end: node.position.end.offset,
				text: `![${escapeMarkdownText(node.alt ?? '')}](${escapeDestination(url)}${title})`,
			});
		} else if (node.type === 'html') {
			const start = node.position.start.offset;
			const html = markdown.slice(start, node.position.end.offset);
			walk(fromHtml(html, { fragment: true, verbose: true }), (element) => {
				if (element.type !== 'element') return;
				for (const name of ['href', 'src']) {
					const value = element.properties?.[name];
					const where = element.data?.position?.properties?.[name];
					if (typeof value !== 'string' || !where) continue;
					const { url, warning } = resolveUrl(value, { ...context, kind: name === 'src' ? 'image' : 'link' });
					if (warning) warnings.push(warning);
					if (url === value) continue;
					edits.push({
						start: start + where.start.offset,
						end: start + where.end.offset,
						text: `${name}="${escapeDestination(url).replace(/&/g, '&amp;')}"`,
					});
				}
			});
		}
	});

	let output = markdown;
	for (const edit of edits.sort((a, b) => b.start - a.start)) {
		output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
	}
	return { markdown: output, warnings };
}

/** Top-level nodes of the `## title` section, or a SyncError naming the section. */
function sectionNodes(tree, title) {
	const start = tree.children.findIndex((node) => isHeading(node, 2) && toString(node).trim() === title);
	if (start === -1) throw new SyncError(`El README no tiene la sección «## ${title}».`);
	const rest = tree.children.slice(start + 1);
	const next = rest.findIndex((node) => node.type === 'heading' && node.depth <= 2);
	return next === -1 ? rest : rest.slice(0, next);
}

const CLIENTS = [
	{ key: 'claudeCode', name: 'Claude Code' },
	{ key: 'codex', name: 'Codex' },
];

const clientFor = (label) => CLIENTS.find((client) => label.startsWith(client.name));

/**
 * Reads the install commands of `## Instalar`: the ```sh block under the **Claude Code** label
 * and the one under the **Codex…** label, verbatim, plus the invocation listed for each client.
 */
export function extractInstall(markdown) {
	const nodes = sectionNodes(parseMarkdown(markdown), INSTALL_SECTION);
	const install = {};
	let current = null;

	for (const node of nodes) {
		const strongOnly =
			node.type === 'paragraph' &&
			node.children.filter((child) => !(child.type === 'text' && child.value.trim() === '')).length === 1 &&
			node.children.some((child) => child.type === 'strong');
		if (strongOnly) {
			const label = toString(node).trim();
			const client = clientFor(label);
			current = client ? client.key : null;
			if (client) {
				if (install[client.key]) throw new SyncError(`«## ${INSTALL_SECTION}» repite la etiqueta **${client.name}**.`);
				install[client.key] = { name: client.name, label, command: null, invoke: null };
			}
			continue;
		}
		if (node.type === 'code' && current && install[current].command === null) {
			if (node.lang !== 'sh') {
				throw new SyncError(`El bloque bajo **${install[current].label}** debe ser \`\`\`sh y es \`\`\`${node.lang ?? ''}.`);
			}
			install[current].command = node.value;
			current = null;
			continue;
		}
		if (node.type === 'list') {
			for (const item of node.children) {
				const paragraph = item.children[0];
				if (paragraph?.type !== 'paragraph') continue;
				const lead = paragraph.children[0];
				const code = paragraph.children.find((child) => child.type === 'inlineCode');
				if (lead?.type !== 'text' || !code) continue;
				const client = CLIENTS.find((candidate) => lead.value.trim() === `${candidate.name}:`);
				if (client && install[client.key]) install[client.key].invoke = code.value;
			}
		}
	}

	for (const client of CLIENTS) {
		const entry = install[client.key];
		if (!entry) throw new SyncError(`«## ${INSTALL_SECTION}» no tiene la etiqueta **${client.name}**.`);
		if (entry.command === null) throw new SyncError(`Falta el bloque \`\`\`sh bajo **${entry.label}** en «## ${INSTALL_SECTION}».`);
		if (entry.command.trim() === '' || entry.command.split('\n').some((line) => line.trim() === '')) {
			throw new SyncError(`El bloque \`\`\`sh bajo **${entry.label}** en «## ${INSTALL_SECTION}» está vacío o tiene líneas vacías.`);
		}
		if (entry.invoke === null) throw new SyncError(`«## ${INSTALL_SECTION}» no dice cómo invocar los skills en ${client.name} («- ${client.name}: \`…\`»).`);
	}
	return install;
}

/** Removes the straight or typographic quotes and the final period around an example request. */
export function unquote(text) {
	const match = text.trim().match(/^["“«]\s*([\s\S]*?)\s*["”»]\s*\.?$/);
	return match ? match[1] : text.trim();
}

/** Reads the skills table of `## Qué le puedes pedir`: name, link and example request, in order. */
export function extractSkills(markdown, context) {
	const nodes = sectionNodes(parseMarkdown(markdown), SKILLS_SECTION);
	const table = nodes.find((node) => node.type === 'table');
	if (!table) throw new SyncError(`«## ${SKILLS_SECTION}» no tiene la tabla de skills.`);
	const [header, ...rows] = table.children;
	const columns = header.children.map((cell) => toString(cell).trim());
	const nameColumn = columns.indexOf('Skill');
	const exampleColumn = columns.indexOf('Ejemplo');
	if (nameColumn === -1 || exampleColumn === -1) {
		throw new SyncError(`La tabla de «## ${SKILLS_SECTION}» necesita las columnas «Skill» y «Ejemplo».`);
	}
	if (rows.length === 0) throw new SyncError(`La tabla de «## ${SKILLS_SECTION}» no tiene filas.`);
	return rows.map((row) => {
		const nameCell = row.children[nameColumn];
		const name = toString(nameCell).trim();
		let link = null;
		walk(nameCell, (node) => {
			if (!link && node.type === 'link') link = node.url;
		});
		return {
			name,
			url: link ? resolveUrl(link, { ...context, kind: 'link' }).url : null,
			example: unquote(toString(row.children[exampleColumn])),
		};
	});
}

/** First sentence of the first paragraph, for the page's meta description. */
export function describe(markdown) {
	const paragraph = parseMarkdown(markdown).children.find((node) => node.type === 'paragraph');
	if (!paragraph) return null;
	// Text only: inline HTML stays out of the meta description.
	const text = toString(paragraph, { includeHtml: false }).replace(/\s+/g, ' ').trim();
	const sentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
	if (sentence.length <= 200) return sentence;
	return `${sentence.slice(0, sentence.lastIndexOf(' ', 197))}…`;
}

const yaml = (value) => JSON.stringify(value);

/** A Starlight page: frontmatter plus the README text it came from. */
export function renderPage({ title, body, order, editUrl, sidebarLabel, source }) {
	const hasSubheadings = parseMarkdown(body).children.some((node) => node.type === 'heading' && node.depth >= 3);
	const description = describe(body);
	const lines = [
		'---',
		`# ${source}`,
		`title: ${yaml(title)}`,
		...(description ? [`description: ${yaml(description)}`] : []),
		`editUrl: ${yaml(editUrl)}`,
		'sidebar:',
		`  order: ${order}`,
		...(sidebarLabel ? [`  label: ${yaml(sidebarLabel)}`] : []),
		...(hasSubheadings ? [] : ['tableOfContents: false']),
		'---',
		'',
	];
	return `${lines.join('\n')}${body.trim()}\n`;
}

/**
 * Builds every generated file from one release: the docs pages (index first) and the data
 * the landing reads. Throws a SyncError when the README lacks something the site needs.
 */
/**
 * HTML the README may carry into the site: documentation markup only. Astro inserts a page's
 * raw HTML unescaped and the schedule publishes new releases without a commit here, so any
 * other element, an event handler or a script URL fails the sync instead of reaching
 * workflows.peqa.ai. Mermaid diagrams are code blocks, not HTML, and Mermaid sanitises them.
 */
const SAFE_ELEMENTS = new Set([
	'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'dd', 'del', 'details', 'div', 'dl', 'dt', 'em', 'h1',
	'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'picture', 'pre',
	'q', 's', 'samp', 'source', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot',
	'th', 'thead', 'tr', 'u', 'ul', 'var',
]);
const SAFE_ATTRIBUTES = new Set([
	'align', 'alt', 'className', 'colSpan', 'dir', 'height', 'href', 'id', 'lang', 'media', 'name', 'open',
	'rowSpan', 'src', 'srcSet', 'start', 'title', 'type', 'width',
]);
const URL_ATTRIBUTES = new Set(['href', 'src', 'srcSet']);

/**
 * True for relative URLs and for http(s) and mailto; false for javascript:, data: and the rest.
 * Browsers drop tabs and line breaks inside a URL («java\tscript:»), so any control character
 * fails, and the protocol is the one the WHATWG URL parser reads, as a browser would.
 */
export function isSafeUrl(value) {
	const url = String(value);
	if (/[\u0000-\u001F\u007F]/.test(url)) return false;
	try {
		return ['http:', 'https:', 'mailto:'].includes(new URL(url.trim(), 'https://relative.invalid/').protocol);
	} catch {
		return false;
	}
}

/** Throws a SyncError naming the first unsafe HTML or link destination of the README. */
export function assertSafeMarkdown(markdown) {
	const fail = (node, what) => {
		const line = node.position?.start.line;
		throw new SyncError(`El README tiene ${what}${line ? ` en la línea ${line}` : ''}; el sitio no lo publica.`);
	};
	walk(parseMarkdown(markdown), (node) => {
		if ((node.type === 'link' || node.type === 'image' || node.type === 'definition') && !isSafeUrl(node.url)) {
			fail(node, `un enlace con un protocolo no permitido («${node.url}»)`);
		}
		if (node.type !== 'html') return;
		walk(fromHtml(node.value, { fragment: true }), (element) => {
			if (element.type !== 'element') return;
			if (!SAFE_ELEMENTS.has(element.tagName)) fail(node, `HTML no permitido (<${element.tagName}>)`);
			for (const [name, value] of Object.entries(element.properties ?? {})) {
				if (!SAFE_ATTRIBUTES.has(name)) fail(node, `un atributo HTML no permitido («${name}» en <${element.tagName}>)`);
				if (!URL_ATTRIBUTES.has(name)) continue;
				const urls = name === 'srcSet' ? String(value).split(',').map((entry) => entry.trim().split(/\s+/)[0]) : [value];
				for (const url of urls) if (!isSafeUrl(url)) fail(node, `un enlace con un protocolo no permitido («${url}»)`);
			}
		});
	});
}

export function buildSite({ readme, release, repo, paths, editUrl, introLabel }) {
	const tag = release.tag;
	assertSafeMarkdown(readme);
	const original = splitReadme(readme);
	const anchors = buildAnchorMap(readme, original.sections);
	const context = { repo, tag, anchors, paths };

	const install = extractInstall(readme);
	const skills = extractSkills(readme, context);
	const { markdown: rewritten, warnings } = rewriteLinks(readme, context);
	// The rewritten Markdown is what the pages carry: check it again, so a rewrite can never
	// turn an accepted destination into markup.
	assertSafeMarkdown(rewritten);
	const split = splitReadme(rewritten);

	const definitions = [];
	walk(parseMarkdown(rewritten), (node) => {
		if (node.type === 'definition') definitions.push(rewritten.slice(node.position.start.offset, node.position.end.offset));
	});
	const withDefinitions = (body) => (definitions.length ? `${body}\n\n${definitions.join('\n')}` : body);

	const source = `Generado por scripts/sync-release.mjs desde README.md de ${repo}@${tag}. No editar.`;
	const pages = [
		{
			slug: 'index',
			title: split.title,
			file: 'index.md',
			content: renderPage({ title: split.title, body: withDefinitions(split.intro), order: 0, editUrl, sidebarLabel: introLabel, source }),
		},
		...split.sections.map((section, index) => ({
			slug: section.slug,
			title: section.title,
			file: `${section.slug}.md`,
			content: renderPage({ title: section.title, body: withDefinitions(section.body), order: index + 1, editUrl, source }),
		})),
	];

	return {
		pages,
		warnings,
		data: {
			repo,
			release: {
				tag,
				version: tag.replace(/^v/, ''),
				name: release.name,
				publishedAt: release.publishedAt,
				url: release.url,
			},
			install,
			skills,
			docs: pages.map(({ slug, title }) => ({ title, url: slug === 'index' ? DOCS_BASE : `${DOCS_BASE}${slug}/` })),
		},
	};
}
