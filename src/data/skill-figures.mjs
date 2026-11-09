// The figure of each skill in «Qué le puedes pedir» (SkillFigure.astro): a short story without
// text, drawn from the theme's commit graph (lines that branch and merge, square nodes). The
// README table decides which skills appear; a skill without a figure here fails the build.
//
// A figure is a list of SVG parts in its 160 × 80 drawing: [tag, classes, attributes] or, for
// a group, [tag, classes, attributes, parts]. Roles and motion live in src/styles/scene.css.
// `s1`–`s4` name the story step at which a part plays, `lag0`–`lag2` its place in a stagger
// inside that step and `long` a part that lasts two steps. The markup is the final frame, and
// every final frame starts at x = 12, so the figures share their left edge in the ledger. The
// accent marks only each story's result.

/** @typedef {[string, string, Record<string, string | number>, Part[]?]} Part */

export const FIGURE_VIEWBOX = '0 0 160 80';

/** @type {Record<string, Part[]>} */
export const skillFigures = {
	// The request becomes a trunk, three lanes open, each lands its work and the lanes merge
	// into the pull request, outlined in the accent.
	dirige: [
		['rect', 'node enter s1', { x: 12, y: 36, width: 8, height: 8 }],
		['path', 'flow draw s1', { d: 'M20 40H40' }],
		['path', 'flow draw s2', { d: 'M40 40C50 40 50 16 60 16H80' }],
		['path', 'flow draw s2', { d: 'M40 40H80' }],
		['path', 'flow draw s2', { d: 'M40 40C50 40 50 64 60 64H80' }],
		['rect', 'node enter s3 lag0', { x: 80, y: 12, width: 8, height: 8 }],
		['rect', 'node enter s3 lag1', { x: 80, y: 36, width: 8, height: 8 }],
		['rect', 'node enter s3 lag2', { x: 80, y: 60, width: 8, height: 8 }],
		['path', 'flow draw s4', { d: 'M88 16H108C118 16 118 40 128 40' }],
		['path', 'flow draw s4', { d: 'M88 40H128' }],
		['path', 'flow draw s4', { d: 'M88 64H108C118 64 118 40 128 40' }],
		['rect', 'frame result enter s4 lag2', { x: 128, y: 33, width: 14, height: 14 }],
	],
	// A question; the line of rounds fills two of its three marks and ends in a decision.
	idea: [
		['path', 'frame enter s1', { d: 'M12 18H52V48H28L20 56V48H12Z' }],
		['path', 'ink-line enter s1', { d: 'M28.5 28a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.2-1.5 2.3V35' }],
		['rect', 'node enter s1', { x: 30.5, y: 38, width: 3, height: 3 }],
		['path', 'flow draw s2 long', { d: 'M52 33H128' }],
		['rect', 'slot filled fill s2 lag2', { x: 64, y: 28, width: 10, height: 10 }],
		['rect', 'slot filled fill s3 lag0', { x: 84, y: 28, width: 10, height: 10 }],
		['rect', 'slot', { x: 104, y: 28, width: 10, height: 10 }],
		['rect', 'frame result enter s4', { x: 128, y: 26, width: 14, height: 14 }],
	],
	// Three tokens (text, panel, accent) flow into a component sketch, whose lines take ink and
	// whose button takes the accent.
	'ui-design': [
		['rect', 'node enter s1 lag0', { x: 12, y: 10, width: 14, height: 14 }],
		['rect', 'swatch-panel enter s1 lag1', { x: 12, y: 33, width: 14, height: 14 }],
		['rect', 'accent enter s1 lag2', { x: 12, y: 56, width: 14, height: 14 }],
		['path', 'flow draw s2', { d: 'M26 17H36C46 17 46 40 56 40H72' }],
		['path', 'flow draw s2', { d: 'M26 40H72' }],
		['path', 'flow draw s2', { d: 'M26 63H36C46 63 46 40 56 40H72' }],
		[
			'g',
			'enter s2 lag2',
			{},
			[
				['rect', 'frame', { x: 72, y: 10, width: 76, height: 60 }],
				['path', 'line inked ink s3 lag0', { d: 'M82 24H128' }],
				['path', 'line inked ink s3 lag1', { d: 'M82 36H116' }],
				['rect', 'accent-button accent-fill s4', { x: 82, y: 50, width: 32, height: 10 }],
			],
		],
	],
	// A diff, a scan across it at a constant speed, then the first of three review marks gets
	// its check and the accent outline of the result. The other two stay empty: the budget.
	revisa: [
		['rect', 'frame enter s1', { x: 12, y: 4, width: 88, height: 72 }],
		['path', 'line draw s1 lag0', { d: 'M30 16H74' }],
		['path', 'line draw s1 lag0', { d: 'M30 28H84' }],
		['path', 'line draw s1 lag1', { d: 'M30 40H66' }],
		['path', 'line draw s1 lag1', { d: 'M30 52H80' }],
		['path', 'line draw s1 lag2', { d: 'M30 64H58' }],
		['rect', 'node enter s1 lag0', { x: 19, y: 26, width: 4, height: 4 }],
		['rect', 'node enter s1 lag1', { x: 19, y: 50, width: 4, height: 4 }],
		['line', 'scan s2', { x1: 12, y1: 4, x2: 100, y2: 4 }],
		['rect', 'slot outline result s4', { x: 110, y: 34, width: 12, height: 12 }],
		['path', 'accent-line draw s3', { d: 'M113 40.5l3 3 5-6' }],
		['rect', 'slot', { x: 127, y: 34, width: 12, height: 12 }],
		['rect', 'slot', { x: 144, y: 34, width: 12, height: 12 }],
	],
	// A note, its approval, then it moves into the pull request's tray, outlined in the accent.
	// The note is drawn in the tray, where it ends; it starts --scene-shift to the right.
	'memoria-guardar': [
		['path', 'slot outline result s4', { d: 'M12 34V74H72V34' }],
		[
			'g',
			'shift s3',
			{},
			[
				['rect', 'frame enter s1', { x: 22, y: 18, width: 40, height: 48 }],
				['path', 'line enter s1', { d: 'M30 30H54' }],
				['path', 'line enter s1', { d: 'M30 40H50' }],
				['path', 'line enter s1', { d: 'M30 50H46' }],
				['path', 'check draw s2', { d: 'M50 12l4 4 8-9' }],
			],
		],
	],
	// A stack of three notes; the relevant one comes out with an accent border and its lines
	// take ink. The stack stays as it was: reading changes nothing. The copy is drawn where it
	// ends, --scene-shift right of the stack's front note.
	'memoria-extraer': [
		['rect', 'frame enter s1 lag0', { x: 12, y: 26, width: 40, height: 48 }],
		['rect', 'frame enter s1 lag1', { x: 18, y: 19, width: 40, height: 48 }],
		['rect', 'frame enter s1 lag2', { x: 24, y: 12, width: 40, height: 48 }],
		['path', 'line enter s1 lag2', { d: 'M32 24H56' }],
		['path', 'line enter s1 lag2', { d: 'M32 34H52' }],
		['path', 'line enter s1 lag2', { d: 'M32 44H48' }],
		[
			'g',
			'shift-in s2',
			{},
			[
				['rect', 'frame result', { x: 104, y: 12, width: 40, height: 48 }],
				['path', 'line inked ink s3 lag0', { d: 'M112 24H136' }],
				['path', 'line inked ink s3 lag1', { d: 'M112 34H132' }],
				['path', 'line inked ink s3 lag2', { d: 'M112 44H128' }],
			],
		],
	],
};
