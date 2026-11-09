import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { rehypeMermaidA11y } from '../config/rehype-mermaid-a11y.mjs';
import { loadTokens, parseTokens, resolveToken } from '../config/tokens.mjs';

describe('tokens', () => {
	test('reads top-level :root blocks only and resolves var() chains', () => {
		const tokens = parseTokens(`
			/* --ignored: red; */
			:root { --base: #050607; --role: var(--base); }
			@media screen { :root { --base: #ffffff; --sl-color-bg: var(--role); } }
		`);
		assert.equal(resolveToken(tokens, '--role'), '#050607');
		assert.equal(tokens.has('--sl-color-bg'), false);
		assert.throws(() => resolveToken(tokens, '--missing'), /--missing/);
	});

	test('every token the build renderers ask for exists in src/styles/tokens.css', () => {
		const token = loadTokens();
		for (const name of ['--color-surface', '--color-text', '--color-text-muted', '--color-code-bg', '--color-border-strong', '--font-body', '--text-sm', '--radius']) {
			assert.ok(token(name), name);
		}
		assert.equal(token('--color-surface'), '#050607');
	});
});

describe('rehypeMermaidA11y', () => {
	const svg = (properties) => ({ type: 'element', tagName: 'svg', properties: { id: 'mermaid-0', style: 'max-width: 905.1px;', viewBox: '0 0 905.1 562.4', ...properties }, children: [] });

	test('reads the diagram as one named image inside a figure', () => {
		const diagram = svg({ role: 'graphics-document document', ariaRoleDescription: 'flowchart-v2', ariaLabelledBy: 'chart-title-mermaid-0', ariaDescribedBy: 'chart-desc-mermaid-0' });
		const tree = { type: 'root', children: [diagram] };
		rehypeMermaidA11y()(tree, { path: 'x.md' });
		const [figure] = tree.children;
		assert.equal(figure.tagName, 'figure');
		assert.deepEqual(figure.properties.className, ['diagram', 'not-content']);
		assert.equal(diagram.properties.role, 'img');
		assert.equal(diagram.properties.ariaRoleDescription, undefined);
		assert.equal(diagram.properties.ariaLabelledBy, 'chart-title-mermaid-0');
		assert.equal(diagram.properties.ariaDescribedBy, 'chart-desc-mermaid-0');
	});

	test('sizes the diagram from its viewBox and lets a keyboard scroll its figure', () => {
		const diagram = svg({ ariaLabelledBy: 'chart-title-mermaid-0', ariaDescribedBy: 'chart-desc-mermaid-0' });
		const tree = { type: 'root', children: [diagram] };
		rehypeMermaidA11y()(tree, { path: 'x.md' });
		const [figure] = tree.children;
		assert.equal(diagram.properties.style, '--diagram-width:906');
		assert.equal(figure.properties.tabIndex, 0);
		assert.equal(figure.properties.ariaLabelledBy, 'chart-title-mermaid-0');
	});

	test('fails when a diagram has no viewBox', () => {
		const tree = { type: 'root', children: [svg({ viewBox: undefined, ariaLabelledBy: 'chart-title-mermaid-0', ariaDescribedBy: 'chart-desc-mermaid-0' })] };
		assert.throws(() => rehypeMermaidA11y()(tree, { path: 'x.md' }), /viewBox/);
	});

	test('fails when a diagram has no accTitle or accDescr', () => {
		const tree = { type: 'root', children: [svg({ ariaLabelledBy: 'chart-title-mermaid-0' })] };
		assert.throws(() => rehypeMermaidA11y()(tree, { path: 'x.md' }), /accTitle y accDescr/);
	});
});
