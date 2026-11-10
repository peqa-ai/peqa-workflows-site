import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { extractSkills } from '../scripts/lib/readme.mjs';
import { FIGURE_HEIGHT, FIGURE_MARGIN, FIGURE_WIDTH, skillFigures } from '../src/data/skill-figures.mjs';
import { assertSkillCoverage } from '../src/lib/skill-coverage.mjs';

const README = readFileSync(new URL('./fixtures/README-v0.17.0.md', import.meta.url), 'utf8');
const CONTEXT = { repo: 'peqa-ai/peqa-workflows', tag: 'v0.17.0', anchors: new Map(), paths: new Map() };
const SKILLS = extractSkills(README, CONTEXT).map((skill) => skill.name);
const SKILLS_EXAMPLES = extractSkills(README, CONTEXT).map((skill) => skill.example);
const FIGURES = { file: 'src/data/skill-figures.mjs', tag: 'v0.17.0', item: 'escenas para ' };

/** Every part of a figure, groups and their children alike. */
const partsOf = (parts) => parts.flatMap((part) => [part, ...partsOf(part[3] ?? [])]);
const MOTION = ['draw', 'enter', 'ink', 'fill', 'outline', 'accent-fill', 'scan', 'arc', 'shift-in', 'pulse', 'slide-in', 'pop', 'seek'];
const STEPS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'];
// Seen only while a story plays: they are not part of the final frame.
const TRANSIENT = ['scan', 'pulse', 'seek'];

describe('assertSkillCoverage', () => {
	test('every skill of the v0.17.0 README table has a figure', () => {
		assert.doesNotThrow(() => assertSkillCoverage({ skills: SKILLS, entries: skillFigures, ...FIGURES }));
	});

	test('a skill without a figure fails the build, naming the file, the release and the skill', () => {
		assert.throws(
			() => assertSkillCoverage({ skills: [...SKILLS, 'nuevo'], entries: skillFigures, ...FIGURES }),
			{
				message:
					'src/data/skill-figures.mjs no coincide con la tabla «Qué le puedes pedir» de v0.17.0: faltan escenas para nuevo.',
			},
		);
	});

	test('a figure for a skill the table no longer lists fails too', () => {
		const skills = SKILLS.filter((name) => name !== 'idea');
		assert.throws(() => assertSkillCoverage({ skills, entries: skillFigures, ...FIGURES }), /sobran escenas para idea\.$/);
	});

	test('keeps the message of the sentences in src/data/skills.ts', () => {
		assert.throws(
			() => assertSkillCoverage({ skills: ['dirige', 'idea'], entries: { dirige: {}, viejo: {} }, file: 'src/data/skills.ts (es)', tag: 'v0.17.0' }),
			{ message: 'src/data/skills.ts (es) no coincide con la tabla «Qué le puedes pedir» de v0.17.0: faltan idea; sobran viejo.' },
		);
	});

	test('an inherited property is not a figure', () => {
		assert.throws(() => assertSkillCoverage({ skills: ['constructor'], entries: {}, ...FIGURES }), /faltan escenas para constructor/);
	});
});

// The extent of a part in the final frame: a rect's corners, a line's ends, or every point of a
// path, following its current point through relative commands. A curve counts its control
// points too, which bound it.
const pathPoints = (d) => {
	const points = [];
	let x = 0;
	let y = 0;
	for (const [, command, args] of d.matchAll(/([MLHVCAZmlhvcaz])([^MLHVCAZmlhvcaz]*)/g)) {
		const n = (args.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
		const lower = command.toLowerCase();
		const size = { m: 2, l: 2, h: 1, v: 1, c: 6, a: 7, z: 0 }[lower];
		for (let i = 0; size && i < n.length; i += size) {
			const p = n.slice(i, i + size);
			const [bx, by] = command === lower ? [x, y] : [0, 0];
			if (lower === 'h') x = bx + p[0];
			else if (lower === 'v') y = by + p[0];
			else if (lower === 'c') {
				points.push([bx + p[0], by + p[1]], [bx + p[2], by + p[3]]);
				[x, y] = [bx + p[4], by + p[5]];
			} else if (lower === 'a') [x, y] = [bx + p[5], by + p[6]];
			else [x, y] = [bx + p[0], by + p[1]];
			points.push([x, y]);
		}
	}
	return points;
};
const pointsOf = ([, , attrs]) => {
	if (attrs.width !== undefined) return [[attrs.x, attrs.y], [attrs.x + attrs.width, attrs.y + attrs.height]];
	if (attrs.x1 !== undefined) return [[attrs.x1, attrs.y1], [attrs.x2, attrs.y2]];
	return attrs.d ? pathPoints(attrs.d) : [];
};

describe('pathPoints', () => {
	test('follows absolute and relative commands', () => {
		assert.deepEqual(pathPoints('M10 20H30V40l5 -5h-2'), [[10, 20], [30, 20], [30, 40], [35, 35], [33, 35]]);
		assert.deepEqual(pathPoints('M0 0C1 2 3 4 5 6'), [[0, 0], [1, 2], [3, 4], [5, 6]]);
		assert.deepEqual(pathPoints('M4 4a3.5 3.5 0 1 1 5 3.2'), [[4, 4], [9, 7.2]]);
	});
});

describe('skill scenes', () => {
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

	test('every story runs from its first step to its tenth, with no step left empty for long', () => {
		for (const [name, { parts }] of Object.entries(skillFigures)) {
			const used = new Set();
			for (const [, className] of partsOf(parts)) {
				const classes = className.split(' ');
				const step = STEPS.findIndex((item) => classes.includes(item));
				if (step < 0) continue;
				const span = classes.includes('span3') ? 3 : classes.includes('long') ? 2 : 1;
				for (let i = step; i < step + span; i++) used.add(STEPS[i]);
			}
			assert.deepEqual([...used].sort((x, y) => STEPS.indexOf(x) - STEPS.indexOf(y)), STEPS, name);
		}
	});

	test('every scene shows cause and effect: a pulse, a scan, a seeking frame or a travelling object', () => {
		for (const [name, { parts }] of Object.entries(skillFigures)) {
			const classes = partsOf(parts).flatMap(([, className]) => className.split(' '));
			assert.ok(['pulse', 'scan', 'seek', 'arc'].some((item) => classes.includes(item)), name);
		}
	});

	test('every final frame stays inside the margins and ends at the right one', () => {
		for (const [name, { parts }] of Object.entries(skillFigures)) {
			const points = partsOf(parts)
				.filter(([, className]) => !className.split(' ').some((item) => TRANSIENT.includes(item)))
				.flatMap(pointsOf);
			const xs = points.map(([x]) => x);
			const ys = points.map(([, y]) => y);
			assert.equal(Math.min(...xs), FIGURE_MARGIN, `${name} starts at the left margin`);
			assert.equal(Math.max(...xs), FIGURE_WIDTH - FIGURE_MARGIN, `${name} ends at the right margin`);
			assert.ok(Math.min(...ys) >= FIGURE_MARGIN, `${name} top`);
			assert.ok(Math.max(...ys) <= FIGURE_HEIGHT - FIGURE_MARGIN, `${name} bottom`);
		}
	});

	test('the accent marks one result per scene: an outline, or the brand button in ui-design', () => {
		for (const [name, { parts }] of Object.entries(skillFigures)) {
			const classes = partsOf(parts).map(([, className]) => className.split(' '));
			const results = classes.filter((list) => list.includes('result')).length;
			const buttons = classes.filter((list) => list.includes('accent-button')).length;
			// memoria-extraer ends in two copies, one per note on the topic. ui-design's pricing
			// page shows the brand's button, the one filled accent.
			assert.equal(results, { 'memoria-extraer': 2, 'ui-design': 0 }[name] ?? 1, name);
			assert.equal(buttons, name === 'ui-design' ? 1 : 0, name);
			assert.ok(!classes.some((list) => list.includes('accent')), `${name} fills nothing else with the accent`);
		}
	});

	test('the scenes that end in a pull request draw it as the hero does: header, number and tag', () => {
		for (const name of ['dirige', 'memoria-guardar']) {
			const all = partsOf(skillFigures[name].parts);
			const hash = all.filter(([, className, attrs]) => className === 'ink-line' && /v12M.*h12M.*h12$/.test(attrs.d ?? ''));
			const tags = all.filter(([tag, className, attrs]) => tag === 'rect' && className.includes('result') && attrs.height === 18);
			assert.equal(hash.length, 1, `${name} number`);
			assert.equal(tags.length, 1, `${name} tag`);
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

describe('words', () => {
	test('splits a request at its spaces and gives it back when joined', async () => {
		const { words } = await import('../src/lib/words.mjs');
		for (const request of SKILLS_EXAMPLES) assert.equal(words(request).join(' '), request);
		assert.deepEqual(words('  Guarda   cómo desplegamos\teste servicio '), ['Guarda', 'cómo', 'desplegamos', 'este', 'servicio']);
	});

	test('no request of the release has more words than reveal.css types one by one', async () => {
		const { words } = await import('../src/lib/words.mjs');
		for (const request of SKILLS_EXAMPLES) assert.ok(words(request).length <= 11, request);
	});
});
