// Reads src/styles/tokens.css so the build-time renderers (Mermaid, Expressive Code), which need
// concrete values rather than CSS variables, take their colors and fonts from the one token file.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// From the project root (where npm runs Astro): Astro bundles ec.config.mjs into dist/, so a
// path relative to this module would not survive the build.
export const TOKENS_FILE = join(process.cwd(), 'src/styles/tokens.css');

/** Custom properties of the top-level `:root` blocks, ignoring blocks nested in at-rules. */
export function parseTokens(css) {
	const tokens = new Map();
	const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
	let depth = 0;
	let rootDepth = -1;
	let selector = '';
	let body = '';
	for (const char of source) {
		if (char === '{') {
			if (depth === 0 && selector.trim() === ':root') rootDepth = 1;
			depth += 1;
			selector = '';
			continue;
		}
		if (char === '}') {
			if (depth === rootDepth) {
				for (const match of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) {
					if (!tokens.has(match[1])) tokens.set(match[1], match[2].trim());
				}
				rootDepth = -1;
				body = '';
			}
			depth -= 1;
			selector = '';
			continue;
		}
		if (depth === 0) selector = char === ';' ? '' : selector + char;
		else if (depth === rootDepth) body += char;
	}
	return tokens;
}

/** A token's value with every `var(--x)` replaced by the value it refers to. */
export function resolveToken(tokens, name, seen = new Set()) {
	if (seen.has(name)) throw new Error(`El token ${name} se refiere a sí mismo.`);
	const value = tokens.get(name);
	if (value === undefined) throw new Error(`Falta el token ${name} en src/styles/tokens.css.`);
	return value.replace(/var\((--[\w-]+)\)/g, (_, ref) => resolveToken(tokens, ref, new Set([...seen, name])));
}

/** `token('--color-text')` returns the resolved value from src/styles/tokens.css. */
export function loadTokens(file = TOKENS_FILE) {
	const tokens = parseTokens(readFileSync(file, 'utf8'));
	return (name) => resolveToken(tokens, name);
}
