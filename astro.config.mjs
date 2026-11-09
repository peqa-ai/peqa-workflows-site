// @ts-check
import { unified } from '@astrojs/markdown-remark';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';
import starlightLinksValidator from 'starlight-links-validator';
import { rehypeMermaidA11y } from './config/rehype-mermaid-a11y.mjs';
import { loadTokens } from './config/tokens.mjs';

const SITE = 'https://workflows.peqa.ai';
const REPO_URL = 'https://github.com/peqa-ai/peqa-workflows';

// Neue Machina is licensed to peqa.ai and must not be copied into this public repository: the
// site loads it from peqa.ai, which allows this origin through CORS. Point PUBLIC_FONT_BASE_URL
// at a local server for local captures.
const fontBase = (process.env.PUBLIC_FONT_BASE_URL || 'https://peqa.ai').replace(/\/+$/, '');
const fontFaces = [
	['Regular', 400],
	['Ultrabold', 800],
]
	.map(
		([file, weight]) =>
			`@font-face{font-family:"Neue Machina";src:url("${fontBase}/NeueMachina-${file}.otf") format("opentype");` +
			`font-weight:${weight};font-style:normal;font-display:swap}`,
	)
	.join('');

const diagramHintScript = `
const figures = document.querySelectorAll('figure.diagram');
const sync = () => {
	for (const figure of figures) {
		const hint = figure.nextElementSibling;
		if (hint?.classList.contains('diagram-hint')) hint.hidden = figure.scrollWidth <= figure.clientWidth + 1;
	}
};
if (figures.length) {
	sync();
	new ResizeObserver(sync).observe(document.body);
}
`;

// Mermaid renders at build time in Chromium, so it needs concrete values: read them from the tokens.
const token = loadTokens();
const px = (rem) => `${parseFloat(rem) * 16}px`;
const mermaidConfig = {
	theme: 'base',
	darkMode: true,
	fontFamily: token('--font-body'),
	flowchart: { htmlLabels: false },
	themeVariables: {
		darkMode: true,
		fontFamily: token('--font-body'),
		fontSize: px(token('--text-sm')),
		background: token('--color-surface'),
		mainBkg: token('--color-code-bg'),
		primaryColor: token('--color-code-bg'),
		secondaryColor: token('--color-code-bg'),
		tertiaryColor: token('--color-code-bg'),
		primaryTextColor: token('--color-text'),
		textColor: token('--color-text'),
		titleColor: token('--color-text'),
		primaryBorderColor: token('--color-border-strong'),
		nodeBorder: token('--color-border-strong'),
		clusterBkg: token('--color-surface-raised'),
		clusterBorder: token('--color-border-strong'),
		lineColor: token('--color-text-muted'),
		edgeLabelBackground: token('--color-surface'),
	},
};
// Locally, CHROME_PATH can point at an installed Chrome instead of Playwright's Chromium.
const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : undefined;

export default defineConfig({
	site: SITE,
	markdown: {
		processor: unified({
			rehypePlugins: [[rehypeMermaid, { strategy: 'inline-svg', mermaidConfig, launchOptions }], rehypeMermaidA11y],
		}),
	},
	integrations: [
		starlight({
			title: 'PEQA workflows',
			description:
				'Documentación de PEQA workflows, el plugin abierto de seis skills para Codex y Claude Code: ' +
				'coordinar agentes, decidir, diseñar interfaces, revisar y guardar memoria del proyecto.',
			defaultLocale: 'root',
			locales: {
				root: { label: 'Español', lang: 'es' },
				en: { label: 'English', lang: 'en' },
			},
			favicon: '/favicon.ico',
			head: [
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon-32.png', type: 'image/png', sizes: '32x32' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
				// Only the weight of the first screen (site title and headline) is preloaded.
				{
					tag: 'link',
					attrs: { rel: 'preload', href: `${fontBase}/NeueMachina-Ultrabold.otf`, as: 'font', type: 'font/otf', crossorigin: 'anonymous' },
				},
				{ tag: 'style', content: fontFaces },
				// Shows a diagram's scroll hint (config/rehype-mermaid-a11y.mjs) only while the figure is
				// narrower than its diagram: on load and whenever the page width or text size changes.
				{
					tag: 'script',
					attrs: { type: 'module' },
					content: diagramHintScript,
				},
			],
			social: [{ icon: 'github', label: 'GitHub', href: REPO_URL }],
			customCss: ['./src/styles/tokens.css', './src/styles/theme.css'],
			components: {
				// The brand is dark only: no theme picker and no script that switches to light.
				ThemeSelect: './src/components/DarkOnly.astro',
				ThemeProvider: './src/components/DarkOnly.astro',
				SiteTitle: './src/components/SiteTitle.astro',
				Hero: './src/components/Hero.astro',
			},
			sidebar: [
				{
					label: 'Documentación',
					translations: { en: 'Documentation' },
					items: [{ autogenerate: { directory: 'docs' } }],
				},
			],
			plugins: [
				// English docs pages are Starlight's fallbacks of the Spanish ones, so links to them are valid.
				starlightLinksValidator({ errorOnFallbackPages: false }),
			],
			credits: false,
		}),
	],
});
