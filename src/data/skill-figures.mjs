// The scene of each skill in «Qué le puedes pedir» (SkillFigure.astro): a story without text,
// drawn from the theme's commit graph (lines that branch and merge, square nodes). The README
// table decides which skills appear; a skill without a scene here fails the build.
//
// Every scene is a drawing of FIGURE_WIDTH × FIGURE_HEIGHT units and a list of SVG parts:
// [tag, classes, attributes] or, for a group, [tag, classes, attributes, parts]. Roles and
// motion live in src/styles/scene.css. `s1`–`s10` name the story step at which a part plays,
// `lag0`–`lag3` its place in a stagger inside that step, and `long` and `span3` a part that
// lasts two or three steps. The markup is the final frame; a pulse, a scan and a seeking frame
// show only while the story plays. The stories tell cause and effect: a pulse travels a line
// before what it reaches appears, lines write themselves, objects travel from where they were. Every drawing keeps FIGURE_MARGIN units free at each
// side and ends at the right margin, so the scenes share their right edge at the end of a row.
// One outline in the accent marks each story's result. The one filled accent is the brand's
// button in ui-design's pricing page, kept small.

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

/**
 * A pull request window at (x, y) in the shape of the hero's: the window, its header with the
 * window's label, and the rule under it.
 */
const pullRequest = (x, y, width, height) => [
	['rect', 'frame', { x, y, width, height }],
	['path', 'line', { d: `M${x + 10} ${y + 10}H${x + 40}` }],
	['path', 'flow', { d: `M${x} ${y + 20}H${x + width}` }],
];
/** The pull request's number at (x, y): a «#» and its digits as a line in ink. */
const number = (x, y) => [
	['path', 'ink-line', { d: `M${x + 3} ${y}v12M${x + 9} ${y}v12M${x} ${y + 4}h12M${x} ${y + 8}h12` }],
	['path', 'line inked', { d: `M${x + 18} ${y + 6}H${x + 40}` }],
];
/** A pulse travelling the path `d` at `step`: seen only while it travels. */
const pulse = (d, step) => ['path', `pulse ${step}`, { d }];
/** A status tag at (x, y), as the hero's «Sin hallazgos»: an outline in the accent with its check. */
const tag = (x, y, step) => [
	['rect', `slot outline result ${step} lag1`, { x, y, width: 44, height: 18 }],
	['path', `accent-line draw ${step} lag2`, { d: `M${x + 16} ${y + 9.5}l4 4 8-9` }],
];

const NOTE_LINES = [26, 20, 14];

/** @type {Record<string, Figure>} */
export const skillFigures = {
	// The request writes itself; a pulse leaves by the trunk, three lanes open and a pulse runs
	// each; a subagent opens its block in each lane, writes its lines and gets its check; the
	// lanes come back, their pulses meet in the parent's node, and one more reaches the pull
	// request, which comes in from the right in the shape of the hero's, writes its number and
	// its title, and takes its status tag in the accent.
	dirige: {
		parts: [
			[
				'g',
				'enter s1',
				{},
				[
					['rect', 'frame', { x: 12, y: 86, width: 68, height: 48 }],
					['path', 'ink-line', { d: 'M21 99l5 5-5 5' }],
					['path', 'line inked draw s1 lag2', { d: 'M34 104H70' }],
					['path', 'line draw s1 lag3', { d: 'M21 120H56' }],
				],
			],
			['path', 'flow draw s2 lag0', { d: 'M80 110H100' }],
			['path', 'flow draw s2 lag2', { d: 'M100 110C116 110 116 40 132 40H140' }],
			['path', 'flow draw s2 lag2', { d: 'M100 110H140' }],
			['path', 'flow draw s2 lag2', { d: 'M100 110C116 110 116 180 132 180H140' }],
			pulse('M80 110H100C116 110 116 40 132 40H140', 's3'),
			pulse('M80 110H140', 's3'),
			pulse('M80 110H100C116 110 116 180 132 180H140', 's3'),
			...[40, 110, 180].flatMap((y, index) => [
				[
					'g',
					`enter s4 lag${index}`,
					{},
					[
						['rect', 'frame', { x: 140, y: y - 24, width: 60, height: 48 }],
						['path', `line draw s4 lag${index + 1}`, { d: `M150 ${y - 9}H190` }],
						['path', `line draw s5 lag${index}`, { d: `M150 ${y + 7}H170` }],
					],
				],
				['path', `check draw s6 lag${index}`, { d: `M178 ${y + 8}l4 4 8-9` }],
			]),
			['path', 'flow draw s7', { d: 'M200 40H216C234 40 234 110 252 110' }],
			['path', 'flow draw s7', { d: 'M200 110H252' }],
			['path', 'flow draw s7', { d: 'M200 180H216C234 180 234 110 252 110' }],
			pulse('M200 40H216C234 40 234 110 252 110', 's8'),
			pulse('M200 110H252', 's8'),
			pulse('M200 180H216C234 180 234 110 252 110', 's8'),
			['rect', 'node enter s8 lag3', { x: 248, y: 106, width: 8, height: 8 }],
			['path', 'flow draw s9 lag0', { d: 'M256 110H292' }],
			pulse('M256 110H292', 's9 lag1'),
			[
				'g',
				'slide-in s9 lag2',
				{},
				[
					...pullRequest(292, 54, 96, 112),
					['path', 'ink-line', { d: 'M305 84v12M311 84v12M302 88h12M302 92h12' }],
					['path', 'line inked draw s10 lag0', { d: 'M320 90H342' }],
					['path', 'line draw s10 lag0', { d: 'M302 108H366' }],
					['path', 'flow', { d: 'M302 122H378' }],
					...tag(302, 134, 's10'),
				],
			],
		],
	},
	// A plan comes in and writes itself; the first question comes out of one of its lines, its
	// answer writes itself, that line of the plan takes ink and the round's mark fills; the second
	// round does the same; the third stays unused; a pulse from each round meets in the decision,
	// which takes the accent with its check.
	idea: {
		parts: [
			[
				'g',
				'enter s1',
				{},
				[
					['rect', 'frame', { x: 12, y: 36, width: 104, height: 148 }],
					['path', 'line draw s2 lag0', { d: 'M26 58H96' }],
					['path', 'line inked ink s4 lag2', { d: 'M26 78H88' }],
					['path', 'line draw s2 lag1', { d: 'M26 98H100' }],
					['path', 'line inked ink s7 lag2', { d: 'M26 118H80' }],
					['path', 'line draw s2 lag2', { d: 'M26 138H94' }],
					['path', 'line draw s2 lag3', { d: 'M26 158H70' }],
				],
			],
			...[
				[62, 's3', 's4', 's5'],
				[110, 's6', 's7', 's8'],
			].flatMap(([y, ask, answer, mark]) => [
				['path', `flow draw ${ask} lag0`, { d: `M116 ${y}H146` }],
				[
					'g',
					`pop ${ask} lag2`,
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
						['path', `line inked draw ${answer} lag2`, { d: `M228 ${y - 6}H274` }],
						['path', `line inked draw ${answer} lag3`, { d: `M228 ${y + 7}H258` }],
					],
				],
				// The round's mark comes in with its answer, and fills once the answer is written.
				['g', `enter ${answer} lag2`, {}, [['rect', `slot filled fill ${mark}`, { x: 300, y: y - 7, width: 14, height: 14 }]]],
			]),
			['path', 'slot enter s8 lag2', { d: 'M146 140H196V176H162L154 184V176H146Z' }],
			['rect', 'slot enter s8 lag3', { x: 300, y: 151, width: 14, height: 14 }],
			['path', 'flow draw s9 lag0', { d: 'M314 62C332 62 328 110 346 110' }],
			['path', 'flow draw s9 lag0', { d: 'M314 110H346' }],
			pulse('M314 62C332 62 328 110 346 110', 's9 lag2'),
			pulse('M314 110H346', 's9 lag2'),
			['rect', 'frame result enter s10 lag0', { x: 346, y: 88, width: 42, height: 44 }],
			['path', 'check draw s10 lag2', { d: 'M358 111l5 5 11-12' }],
		],
	},
	// The project's tokens (text, surface, border and type) come in and a pulse carries each to a
	// pricing page built with this brand's components, which assembles itself: its title, its
	// rules, three plans that write what they include and get their checks, and their square
	// buttons, the recommended plan's filled with the accent. Two pulses reach the reviewers, who
	// score it.
	'ui-design': {
		parts: [
			['rect', 'node enter s1 lag0', { x: 12, y: 30, width: 28, height: 28 }],
			['rect', 'swatch-panel enter s1 lag1', { x: 12, y: 74, width: 28, height: 28 }],
			['rect', 'swatch-line enter s1 lag2', { x: 12, y: 118, width: 28, height: 28 }],
			['path', 'ink-line enter s1 lag3', { d: 'M12 168H40M12 182H30' }],
			...['M40 44C84 44 76 110 120 110', 'M40 88C80 88 80 110 120 110', 'M40 132C80 132 80 110 120 110', 'M40 175C84 175 76 110 120 110'].flatMap(
				(d, index) => [
					['path', 'flow draw s2', { d }],
					pulse(d, `s3 lag${index}`),
				],
			),
			[
				'g',
				'enter s4',
				{},
				[
					['rect', 'frame', { x: 120, y: 20, width: 180, height: 180 }],
					['path', 'line inked draw s4 lag2', { d: 'M134 40H206' }],
					['path', 'flow draw s5 lag0', { d: 'M134 56H286' }],
					['path', 'flow draw s5 lag2', { d: 'M183.5 68V186M236.5 68V186' }],
					...[134, 187, 240].flatMap((x, plan) => [
						['path', `line inked draw s6 lag${plan}`, { d: `M${x} 76H${x + 26}` }],
						['path', `ink-line draw s7 lag${plan + 1}`, { d: [100, 116, 132].slice(0, plan + 1).map((y) => `M${x} ${y}l2.5 2.5 5-5.5`).join('') }],
						...[100, 116, 132].slice(0, plan + 1).map((y) => ['path', `line draw s7 lag${plan}`, { d: `M${x + 14} ${y}H${x + 40}` }]),
					]),
					['rect', 'swatch-line enter s8 lag0', { x: 134, y: 160, width: 43, height: 18 }],
					['rect', 'accent-button accent-fill s8 lag2', { x: 190, y: 160, width: 40, height: 18 }],
					['rect', 'swatch-line enter s8 lag1', { x: 243, y: 160, width: 43, height: 18 }],
				],
			],
			['path', 'flow draw s9 lag0', { d: 'M300 110C322 110 322 66 344 66' }],
			['path', 'flow draw s9 lag0', { d: 'M300 110C322 110 322 154 344 154' }],
			pulse('M300 110C322 110 322 66 344 66', 's9 lag2'),
			pulse('M300 110C322 110 322 154 344 154', 's9 lag2'),
			['rect', 'frame enter s9 lag3', { x: 344, y: 44, width: 44, height: 44 }],
			['rect', 'frame enter s9 lag3', { x: 344, y: 132, width: 44, height: 44 }],
			['path', 'check draw s10 lag0', { d: 'M356 67l5 5 11-12' }],
			['path', 'check draw s10 lag2', { d: 'M356 155l5 5 11-12' }],
		],
	},
	// A diff writes itself; a scan crosses it at a constant speed and, as it passes, each changed
	// line gets its «−» or its «+» and is written again in ink; a pulse goes out to each of three
	// lenses (tests, security and impact), and each gets its check; a pulse from each lens meets
	// in the first of three review marks, which takes its check and the accent outline. The other
	// two stay empty: the budget.
	revisa: {
		parts: [
			['rect', 'frame enter s1', { x: 12, y: 20, width: 140, height: 180 }],
			...[
				[120, '', ''],
				[100, '-', 's3 lag3'],
				[132, '+', 's4 lag0'],
				[92, '', ''],
				[126, '-', 's4 lag3'],
				[110, '+', 's5 lag0'],
				[84, '+', 's5 lag2'],
			].flatMap(([end, mark, when], index) => {
				const y = 44 + index * 20;
				const d = `M38 ${y}H${end}`;
				const line = ['path', `line draw s2 lag${Math.min(index >> 1, 3)}`, { d }];
				const sign = `M21 ${y}h8${mark === '+' ? `M25 ${y - 4}v8` : ''}`;
				return mark ? [line, ['path', `line inked draw ${when}`, { d }], ['path', `ink-line enter ${when}`, { d: sign }]] : [line];
			}),
			['line', 'scan s3 span3', { x1: 12, y1: 20, x2: 152, y2: 20 }],
			...['M152 110C172 110 172 50 192 50', 'M152 110H192', 'M152 110C172 110 172 170 192 170'].flatMap((d) => [
				['path', 'flow draw s6 lag0', { d }],
				pulse(d, 's6 lag2'),
			]),
			[
				'g',
				'pop s7 lag0',
				{},
				[
					['rect', 'frame', { x: 192, y: 28, width: 44, height: 44 }],
					['path', 'ink-line', { d: 'M202 42h4M210 42h16M202 50h4M210 50h16M202 58h4M210 58h10' }],
				],
			],
			[
				'g',
				'pop s7 lag1',
				{},
				[
					['rect', 'frame', { x: 192, y: 88, width: 44, height: 44 }],
					['path', 'ink-line', { d: 'M214 97l11 4v9l-11 13l-11-13v-9z' }],
				],
			],
			[
				'g',
				'pop s7 lag2',
				{},
				[
					['rect', 'frame', { x: 192, y: 148, width: 44, height: 44 }],
					['path', 'ink-line', { d: 'M210 166h8v8h-8zM203 159h22v22h-22z' }],
				],
			],
			['path', 'check draw s8 lag0', { d: 'M244 51l4 4 8-9' }],
			['path', 'check draw s8 lag1', { d: 'M244 111l4 4 8-9' }],
			['path', 'check draw s8 lag2', { d: 'M244 171l4 4 8-9' }],
			...['M264 50H276C296 50 296 110 322 110', 'M264 110H322', 'M264 170H276C296 170 296 110 322 110'].flatMap((d) => [
				['path', 'flow draw s9 lag0', { d }],
				pulse(d, 's9 lag2'),
			]),
			// The three review marks come in with the lines that reach them.
			[
				'g',
				'enter s9 lag0',
				{},
				[
					['rect', 'slot outline result s10 lag0', { x: 322, y: 101, width: 18, height: 18 }],
					['rect', 'slot', { x: 346, y: 101, width: 18, height: 18 }],
					['rect', 'slot', { x: 370, y: 101, width: 18, height: 18 }],
				],
			],
			['path', 'accent-line draw s10 lag2', { d: 'M326 110.5l4 4 7-8' }],
		],
	},
	// Three notes come in beside a pull request in the shape of the hero's; the first to be
	// approved gets its check and travels in an arc into the pull request, then the second, one
	// by one; the note nobody approved gets a cross and stays where it was; inside the pull
	// request the notes are written again in ink, and its status tag takes the accent. Approved notes are
	// drawn in the pull request, where they end, --scene-carry right of the places they leave,
	// which stay marked with a dashed outline once they are gone.
	'memoria-guardar': {
		parts: [
			['g', 'enter s1 lag0', {}, note(12, 62, 42, 72, NOTE_LINES.map((length) => [length, 'line']))],
			['path', 'ink-line draw s9 lag0', { d: 'M35 115l9 9M44 115l-9 9' }],
			['rect', 'ghost enter s4 lag2', { x: 74, y: 62, width: 42, height: 72 }],
			['rect', 'ghost enter s7 lag2', { x: 136, y: 62, width: 42, height: 72 }],
			[
				'g',
				'slide-in s2',
				{},
				[...pullRequest(264, 20, 124, 180), ...number(338, 24)],
			],
			...[
				[274, 1, 's3', 's4'],
				[336, 2, 's6', 's7'],
			].map(([x, lag, approve, carry]) => [
				'g',
				`arc ${carry} long`,
				{},
				[
					...note(
						x,
						62,
						42,
						72,
						NOTE_LINES.map((length) => [length, `line enter s1 lag${lag}`]),
						`frame enter s1 lag${lag}`,
					),
					// Inside the pull request the note is written again, in ink.
					...NOTE_LINES.map((length, index) => ['path', `line inked draw s9 lag${index + 1}`, { d: `M${x + 8} ${76 + index * 12}H${x + 8 + length}` }]),
					['path', `check draw ${approve}`, { d: `M${x + 22} 121l4 4 8-9` }],
				],
			]),
			// The pull request's status comes in once the notes are in it.
			['g', 'enter s9 lag2', {}, [['path', 'flow', { d: 'M274 148H378' }], ...tag(274, 164, 's10')]],
		],
	},
	// The catalogue of notes comes in; a seeking frame goes over it note by note, and the two on
	// the topic take ink as it passes; a pulse leaves each of them, and a copy of each comes out
	// along the way and writes itself, outlined in the accent. The catalogue stays as it was:
	// reading changes nothing. A copy is drawn where it ends and comes in from --scene-shift to
	// its left.
	'memoria-extraer': {
		parts: [
			...[20, 84, 148].flatMap((y, row) =>
				[12, 60].map((x, column) => {
					const match = column === 1 && row !== 1;
					const line = match ? `line inked ink ${row ? 's4' : 's2'} lag3` : 'line';
					return ['g', `enter s1 lag${row}`, {}, note(x, y, 40, 52, [[24, line], [18, line], [12, line]])];
				}),
			),
			['rect', 'seek s2 span3', { x: 12, y: 20, width: 40, height: 52 }],
			...['M100 46C168 46 168 110 236 110H272', 'M100 174C168 174 168 110 236 110'].flatMap((d) => [
				['path', 'flow draw s5', { d }],
				pulse(d === 'M100 174C168 174 168 110 236 110' ? `${d}H272` : d, 's6'),
			]),
			...[
				[272, 's7', 's8'],
				[336, 's8', 's9'],
			].map(([x, out, write]) => [
				'g',
				`shift-in ${out}`,
				{},
				note(
					x,
					76,
					52,
					68,
					[36, 28, 20].map((length, index) => [length, `line inked draw ${write} lag${index}`]),
					'frame result outline s10',
				),
			]),
		],
	},
};
