// The scene of each skill in «Qué le puedes pedir» (SkillFigure.astro): a story without text,
// drawn from the theme's commit graph (lines that branch and merge, square nodes). The README
// table decides which skills appear; a skill without a scene here fails the build.
//
// Every scene is a drawing of FIGURE_WIDTH × FIGURE_HEIGHT units and a list of SVG parts:
// [tag, classes, attributes] or, for a group, [tag, classes, attributes, parts]. Roles and
// motion live in src/styles/scene.css. `s1`–`s6` name the story step at which a part plays,
// `lag0`–`lag2` its place in a stagger inside that step and `long` a part that lasts two
// steps. The markup is the final frame. Every drawing keeps FIGURE_MARGIN units free at each
// side and ends at the right margin, so the scenes share their right edge at the end of a row.
// One outline in the accent marks each story's result; nothing is filled with it.

/** @typedef {[string, string, Record<string, string | number>, Part[]?]} Part */
/** @typedef {{ parts: Part[] }} Figure */

export const FIGURE_WIDTH = 400;
export const FIGURE_HEIGHT = 220;
export const FIGURE_MARGIN = 12;

/** A note of `width` × `height` units at (x, y) with its lines of text, each `[length, classes]`. */
const note = (x, y, width, height, lines, frame = 'frame') => [
	['rect', frame, { x, y, width, height }],
	...lines.map(([length, classes], index) => ['path', classes, { d: `M${x + 8} ${y + 14 + index * 12}H${x + 8 + length}` }]),
];

const NOTE_LINES = [26, 20, 14];

/** @type {Record<string, Figure>} */
export const skillFigures = {
	// The request becomes a trunk, three lanes open, a subagent lands its work in each and gets
	// its check, the parent merges the lanes and the pull request comes out, outlined in the
	// accent.
	dirige: {
		parts: [
			[
				'g',
				'enter s1',
				{},
				[
					['rect', 'frame', { x: 12, y: 86, width: 84, height: 48 }],
					['path', 'ink-line', { d: 'M22 99l5 5-5 5' }],
					['path', 'line inked', { d: 'M36 104H84' }],
					['path', 'line', { d: 'M22 120H66' }],
				],
			],
			['path', 'flow draw s2 lag0', { d: 'M96 110H124' }],
			['path', 'flow draw s2 lag2', { d: 'M124 110C142 110 142 40 160 40H184' }],
			['path', 'flow draw s2 lag2', { d: 'M124 110H184' }],
			['path', 'flow draw s2 lag2', { d: 'M124 110C142 110 142 180 160 180H184' }],
			...[40, 110, 180].flatMap((y, index) => [
				[
					'g',
					`enter s3 lag${index}`,
					{},
					[
						['rect', 'frame', { x: 184, y: y - 24, width: 72, height: 48 }],
						['path', 'line', { d: `M194 ${y - 9}H244` }],
						['path', 'line', { d: `M194 ${y + 7}H222` }],
					],
				],
				['path', `check draw s4 lag${index}`, { d: `M232 ${y + 8}l4 4 8-9` }],
			]),
			['path', 'flow draw s5 lag0', { d: 'M256 40H280C298 40 298 110 316 110' }],
			['path', 'flow draw s5 lag0', { d: 'M256 110H316' }],
			['path', 'flow draw s5 lag0', { d: 'M256 180H280C298 180 298 110 316 110' }],
			['rect', 'node enter s5 lag2', { x: 312, y: 106, width: 8, height: 8 }],
			['path', 'flow draw s6 lag0', { d: 'M320 110H344' }],
			[
				'g',
				'enter s6 lag2',
				{},
				[
					['rect', 'frame result', { x: 344, y: 84, width: 44, height: 52 }],
					['path', 'line inked', { d: 'M354 102H378' }],
					['path', 'line', { d: 'M354 118H370' }],
				],
			],
		],
	},
	// A plan; two rounds of a question and its answer, each inking a line of the plan and filling
	// its mark; the third round stays unused; the rounds end in a decision, outlined in the
	// accent.
	idea: {
		parts: [
			[
				'g',
				'enter s1',
				{},
				[
					['rect', 'frame', { x: 12, y: 36, width: 104, height: 148 }],
					['path', 'line', { d: 'M26 58H96' }],
					['path', 'line inked ink s3', { d: 'M26 78H88' }],
					['path', 'line', { d: 'M26 98H100' }],
					['path', 'line inked ink s5', { d: 'M26 118H80' }],
					['path', 'line', { d: 'M26 138H94' }],
					['path', 'line', { d: 'M26 158H70' }],
				],
			],
			...[
				[62, 's2', 's3'],
				[110, 's4', 's5'],
			].flatMap(([y, ask, answer]) => [
				['path', `flow draw ${ask} lag0`, { d: `M116 ${y}H146` }],
				[
					'g',
					`enter ${ask} lag2`,
					{},
					[
						['path', 'frame', { d: `M146 ${y - 18}H196V${y + 18}H162L154 ${y + 26}V${y + 18}H146Z` }],
						['path', 'ink-line', { d: `M167.5 ${y - 5}a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.2-1.5 2.3V${y + 2}` }],
						['rect', 'node', { x: 169.5, y: y + 5, width: 3, height: 3 }],
					],
				],
				['path', `flow draw ${answer} lag0`, { d: `M196 ${y}H218` }],
				[
					'g',
					`enter ${answer} lag1`,
					{},
					[
						['rect', 'frame', { x: 218, y: y - 18, width: 68, height: 36 }],
						['path', 'line inked', { d: `M228 ${y - 6}H274` }],
						['path', 'line inked', { d: `M228 ${y + 7}H258` }],
					],
				],
				['rect', `slot filled fill ${answer} lag2`, { x: 300, y: y - 7, width: 14, height: 14 }],
			]),
			['path', 'slot enter s1', { d: 'M146 140H196V176H162L154 184V176H146Z' }],
			['rect', 'slot', { x: 300, y: 151, width: 14, height: 14 }],
			['path', 'flow draw s6 lag0', { d: 'M314 62C332 62 328 110 346 110' }],
			['path', 'flow draw s6 lag0', { d: 'M314 110H346' }],
			['rect', 'frame result enter s6 lag1', { x: 346, y: 88, width: 42, height: 44 }],
			['path', 'check draw s6 lag2', { d: 'M358 111l5 5 11-12' }],
		],
	},
	// The project's tokens (text, surface, border and type) flow into a screen, which takes ink
	// from them; two reviewers score it, and its outline takes the accent.
	'ui-design': {
		parts: [
			['rect', 'node enter s1 lag0', { x: 12, y: 30, width: 28, height: 28 }],
			['rect', 'swatch-panel enter s1 lag1', { x: 12, y: 74, width: 28, height: 28 }],
			['rect', 'swatch-line enter s1 lag2', { x: 12, y: 118, width: 28, height: 28 }],
			['path', 'ink-line enter s1 lag2', { d: 'M12 168H40M12 182H30' }],
			['path', 'flow draw s2 lag0', { d: 'M40 44C84 44 76 110 120 110' }],
			['path', 'flow draw s2 lag0', { d: 'M40 88C80 88 80 110 120 110' }],
			['path', 'flow draw s2 lag0', { d: 'M40 132C80 132 80 110 120 110' }],
			['path', 'flow draw s2 lag0', { d: 'M40 175C84 175 76 110 120 110' }],
			[
				'g',
				'enter s2 lag2',
				{},
				[
					['rect', 'frame result outline s6 lag2', { x: 120, y: 20, width: 180, height: 180 }],
					['path', 'line inked ink s3 lag0', { d: 'M136 42H206' }],
					['rect', 'panel', { x: 134, y: 58, width: 152, height: 54 }],
					['path', 'line inked ink s3 lag1', { d: 'M136 130H264' }],
					['path', 'line inked ink s3 lag2', { d: 'M136 146H236' }],
					['rect', 'slot filled fill s4', { x: 134, y: 164, width: 64, height: 20 }],
					['rect', 'swatch-line', { x: 208, y: 164, width: 50, height: 20 }],
				],
			],
			['path', 'flow draw s5 lag0', { d: 'M300 110C322 110 322 66 344 66' }],
			['path', 'flow draw s5 lag0', { d: 'M300 110C322 110 322 154 344 154' }],
			['rect', 'frame enter s5 lag2', { x: 344, y: 44, width: 44, height: 44 }],
			['rect', 'frame enter s5 lag2', { x: 344, y: 132, width: 44, height: 44 }],
			['path', 'check draw s6 lag0', { d: 'M356 67l5 5 11-12' }],
			['path', 'check draw s6 lag1', { d: 'M356 155l5 5 11-12' }],
		],
	},
	// A diff; a scan crosses it at a constant speed; the review looks through three lenses
	// (tests, security and blast radius) and each gets its check; then the first of three
	// review marks takes its check and the accent outline. The other two stay empty: the budget.
	revisa: {
		parts: [
			['rect', 'frame enter s1', { x: 12, y: 20, width: 140, height: 180 }],
			...[
				[120, 0],
				[100, 0],
				[132, 1],
				[92, 1],
				[126, 2],
				[110, 2],
				[84, 2],
			].map(([end, lag], index) => ['path', `line draw s1 lag${lag}`, { d: `M36 ${44 + index * 20}H${end}` }]),
			['rect', 'node enter s1 lag0', { x: 22, y: 62, width: 4, height: 4 }],
			['rect', 'node enter s1 lag1', { x: 22, y: 122, width: 4, height: 4 }],
			['rect', 'node enter s1 lag2', { x: 22, y: 142, width: 4, height: 4 }],
			['line', 'scan s2', { x1: 12, y1: 20, x2: 152, y2: 20 }],
			['path', 'flow draw s3 lag0', { d: 'M152 110C172 110 172 50 192 50' }],
			['path', 'flow draw s3 lag0', { d: 'M152 110H192' }],
			['path', 'flow draw s3 lag0', { d: 'M152 110C172 110 172 170 192 170' }],
			[
				'g',
				'enter s3 lag2',
				{},
				[
					['rect', 'frame', { x: 192, y: 28, width: 44, height: 44 }],
					['path', 'ink-line', { d: 'M202 42h4M210 42h16M202 50h4M210 50h16M202 58h4M210 58h10' }],
				],
			],
			[
				'g',
				'enter s3 lag2',
				{},
				[
					['rect', 'frame', { x: 192, y: 88, width: 44, height: 44 }],
					['path', 'ink-line', { d: 'M214 97l11 4v9l-11 13l-11-13v-9z' }],
				],
			],
			[
				'g',
				'enter s3 lag2',
				{},
				[
					['rect', 'frame', { x: 192, y: 148, width: 44, height: 44 }],
					['path', 'ink-line', { d: 'M210 166h8v8h-8zM203 159h22v22h-22z' }],
				],
			],
			['path', 'check draw s4 lag0', { d: 'M244 51l4 4 8-9' }],
			['path', 'check draw s4 lag1', { d: 'M244 111l4 4 8-9' }],
			['path', 'check draw s4 lag2', { d: 'M244 171l4 4 8-9' }],
			['path', 'flow draw s5', { d: 'M264 50H276C296 50 296 110 322 110' }],
			['path', 'flow draw s5', { d: 'M264 110H322' }],
			['path', 'flow draw s5', { d: 'M264 170H276C296 170 296 110 322 110' }],
			['rect', 'slot outline result s6 lag0', { x: 322, y: 101, width: 18, height: 18 }],
			['path', 'accent-line draw s6 lag1', { d: 'M326 110.5l4 4 7-8' }],
			['rect', 'slot', { x: 346, y: 101, width: 18, height: 18 }],
			['rect', 'slot', { x: 370, y: 101, width: 18, height: 18 }],
		],
	},
	// Three notes beside the pull request; two are approved, one after the other, and each
	// travels into the pull request once it has its check; there their lines take ink, and the
	// pull request ends outlined in the accent. The note nobody approved stays where it was.
	// Approved notes are drawn in the pull request, where they end, --scene-carry right of the
	// places they leave, which stay marked.
	'memoria-guardar': {
		parts: [
			['g', '', {}, note(12, 74, 42, 72, NOTE_LINES.map((length) => [length, 'line']))],
			['path', 'flow draw s2 long', { d: 'M178 110H264' }],
			['rect', 'ghost', { x: 74, y: 74, width: 42, height: 72 }],
			['rect', 'ghost', { x: 136, y: 74, width: 42, height: 72 }],
			['rect', 'slot outline result s6', { x: 264, y: 44, width: 124, height: 132 }],
			['path', 'flow', { d: 'M264 62H388' }],
			...[
				[274, 's1', 's2'],
				[336, 's3', 's4'],
			].map(([x, approve, carry]) => [
				'g',
				`carry ${carry}`,
				{},
				[
					...note(
						x,
						74,
						42,
						72,
						NOTE_LINES.map((length, index) => [length, `line inked ink s5 lag${index}`]),
					),
					['path', `check draw ${approve}`, { d: `M${x + 22} 133l4 4 8-9` }],
				],
			]),
		],
	},
	// The catalogue of notes; the two on the topic take ink and a copy of each comes out, outlined
	// in the accent. The catalogue stays as it was: reading changes nothing. A copy is drawn
	// where it ends and comes in from --scene-shift to its left.
	'memoria-extraer': {
		parts: [
			...[20, 84, 148].flatMap((y, row) =>
				[12, 60].map((x, column) => {
					const match = column === 1 && row !== 1;
					const line = match ? 'line inked ink s2' : 'line';
					return ['g', `enter s1 lag${row}`, {}, note(x, y, 40, 52, [[24, line], [18, line], [12, line]])];
				}),
			),
			['path', 'flow draw s3 long', { d: 'M100 46C168 46 168 110 236 110H272' }],
			['path', 'flow draw s3 long', { d: 'M100 174C168 174 168 110 236 110' }],
			...[
				[272, 's4', 's5'],
				[336, 's5', 's6'],
			].map(([x, out, read]) => [
				'g',
				`shift-in ${out}`,
				{},
				note(
					x,
					76,
					52,
					68,
					[36, 28, 20].map((length, index) => [length, `line inked ink ${read} lag${index}`]),
					'frame result',
				),
			]),
		],
	},
};
