import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { extractSkills } from '../scripts/lib/readme.mjs';
import { FIGURE_HEIGHT, skillFigures } from '../src/data/skill-figures.mjs';
import { assertSkillCoverage } from '../src/lib/skill-coverage.mjs';

const README = readFileSync(new URL('./fixtures/README-v0.17.0.md', import.meta.url), 'utf8');
const CONTEXT = { repo: 'peqa-ai/peqa-workflows', tag: 'v0.17.0', anchors: new Map(), paths: new Map() };
const SKILLS = extractSkills(README, CONTEXT).map((skill) => skill.name);
const FIGURES = { file: 'src/data/skill-figures.mjs', tag: 'v0.17.0', item: 'figuras para ' };

/** Every part of a figure, groups and their children alike. */
const partsOf = (parts) => parts.flatMap((part) => [part, ...partsOf(part[3] ?? [])]);
const MOTION = ['draw', 'enter', 'ink', 'fill', 'outline', 'accent-fill', 'scan', 'drop', 'shift-in'];
const STEPS = ['s1', 's2', 's3', 's4'];

describe('assertSkillCoverage', () => {
	test('every skill of the v0.17.0 README table has a figure', () => {
		assert.doesNotThrow(() => assertSkillCoverage({ skills: SKILLS, entries: skillFigures, ...FIGURES }));
	});

	test('a skill without a figure fails the build, naming the file, the release and the skill', () => {
		assert.throws(
			() => assertSkillCoverage({ skills: [...SKILLS, 'nuevo'], entries: skillFigures, ...FIGURES }),
			{
				message:
					'src/data/skill-figures.mjs no coincide con la tabla «Qué le puedes pedir» de v0.17.0: faltan figuras para nuevo.',
			},
		);
	});

	test('a figure for a skill the table no longer lists fails too', () => {
		const skills = SKILLS.filter((name) => name !== 'idea');
		assert.throws(() => assertSkillCoverage({ skills, entries: skillFigures, ...FIGURES }), /sobran figuras para idea\.$/);
	});

	test('keeps the message of the sentences in src/data/skills.ts', () => {
		assert.throws(
			() => assertSkillCoverage({ skills: ['dirige', 'idea'], entries: { dirige: {}, viejo: {} }, file: 'src/data/skills.ts (es)', tag: 'v0.17.0' }),
			{ message: 'src/data/skills.ts (es) no coincide con la tabla «Qué le puedes pedir» de v0.17.0: faltan idea; sobran viejo.' },
		);
	});

	test('an inherited property is not a figure', () => {
		assert.throws(() => assertSkillCoverage({ skills: ['constructor'], entries: {}, ...FIGURES }), /faltan figuras para constructor/);
	});
});

describe('skill figures', () => {
	test('carry no text: the row beside them already says what the skill does', () => {
		for (const [name, { parts }] of Object.entries(skillFigures)) {
			for (const [tag] of partsOf(parts)) assert.notEqual(tag, 'text', name);
		}
	});

	test('every moving part names its step, and every step names a motion', () => {
		for (const [name, { parts }] of Object.entries(skillFigures)) {
			for (const [tag, className] of partsOf(parts)) {
				const classes = className.split(' ');
				const motions = classes.filter((item) => MOTION.includes(item));
				const steps = classes.filter((item) => STEPS.includes(item));
				assert.ok(motions.length <= 1, `${name}: ${tag}.${classes.join('.')} has more than one motion`);
				assert.equal(steps.length, motions.length, `${name}: ${tag}.${classes.join('.')}`);
			}
		}
	});

	test('every final frame starts at the same x and ends 4 units before its width', () => {
		// A part's horizontal extent: a rect's x and x + width, a line's x1 and x2, or the x of
		// every point of a path, following its current point through relative commands.
		const pathXs = (d) => {
			const xs = [];
			let x = 0;
			let y = 0;
			for (const [, command, args] of d.matchAll(/([MLHVCAZmlhvcaz])([^MLHVCAZmlhvcaz]*)/g)) {
				const n = (args.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
				const relative = command === command.toLowerCase();
				const size = { m: 2, l: 2, h: 1, v: 1, c: 6, a: 7, z: 0 }[command.toLowerCase()];
				for (let i = 0; size && i < n.length; i += size) {
					const p = n.slice(i, i + size);
					const lower = command.toLowerCase();
					if (lower === 'h') x = (relative ? x : 0) + p[0];
					else if (lower === 'v') y = (relative ? y : 0) + p[0];
					else if (lower === 'c') {
						xs.push((relative ? x : 0) + p[0], (relative ? x : 0) + p[2]);
						[x, y] = [(relative ? x : 0) + p[4], (relative ? y : 0) + p[5]];
					} else if (lower === 'a') [x, y] = [(relative ? x : 0) + p[5], (relative ? y : 0) + p[6]];
					else [x, y] = [(relative ? x : 0) + p[0], (relative ? y : 0) + p[1]];
					xs.push(x);
				}
			}
			return xs;
		};
		const extent = ([, , attrs]) => {
			if (attrs.width !== undefined) return [attrs.x, attrs.x + attrs.width];
			if (attrs.x1 !== undefined) return [attrs.x1, attrs.x2];
			return attrs.d ? pathXs(attrs.d) : [];
		};
		for (const [name, { width, parts }] of Object.entries(skillFigures)) {
			const xs = partsOf(parts).flatMap(extent);
			assert.equal(Math.min(...xs), 12, `${name} starts at 12`);
			assert.equal(Math.max(...xs), width - 4, `${name} ends at its width less 4`);
		}
	});

	test('all figures are as high as FIGURE_HEIGHT and no wider than the 160-unit box', () => {
		for (const [name, { width, parts }] of Object.entries(skillFigures)) {
			assert.ok(width <= 160, name);
			for (const [, , attrs] of partsOf(parts)) {
				if (attrs.height !== undefined) assert.ok(attrs.y >= 0 && attrs.y + attrs.height <= FIGURE_HEIGHT, `${name} rect inside`);
			}
		}
	});

	test('a drawn stroke is a path or a line, and groups nest one level at most', () => {
		for (const [name, { parts }] of Object.entries(skillFigures)) {
			for (const [tag, className] of partsOf(parts)) {
				if (className.split(' ').includes('draw')) assert.ok(['path', 'line'].includes(tag), `${name}: ${tag}`);
			}
			for (const [, , , children = []] of parts) {
				for (const child of children) assert.equal(child[3], undefined, `${name}: nested group`);
			}
		}
	});
});
