// Turns on the landing's reveal scopes (src/styles/reveal.css): the sections and the skills'
// rows whose blocks come in with the scroll. Only a scope still below the screen at load is
// turned on, so nothing already visible changes; the rest keep the markup's final state.

import { belowScreen, playOnView, reducedMotion } from './play-on-view';

/**
 * What the scroll-linked path really uses: a view timeline with a name, parts that follow it
 * by that name, and ranges of its cover given as lengths. A browser that lacks any of them
 * takes the timed path whole, rather than half of each. The same test guards the rules in
 * reveal.css and scene.css.
 */
const SCROLL_PATH = ['animation-timeline: --reveal', 'view-timeline: --reveal block', 'animation-range-start: cover 1px'];

/** The height the header keeps at the top of the screen, as the page's scroll padding says. */
const headerHeight = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;

/**
 * Pins each row that fits the screen (data-pin), centered under the header (--pin-top), and
 * unpins one that no longer fits: after a resize, a rotation or a larger text size. A row
 * taller than the room under the header is never pinned, so nothing of it is held off screen.
 */
function pinRows(rows: HTMLElement[]) {
	const measure = () => {
		const top = headerHeight();
		const margin = parseFloat(getComputedStyle(document.documentElement).fontSize) || 0;
		for (const row of rows) {
			const content = row.firstElementChild;
			if (!(content instanceof HTMLElement)) continue;
			const room = innerHeight - top - content.offsetHeight;
			if (room >= 2 * margin) {
				row.dataset.pin = '';
				row.style.setProperty('--pin-top', `${Math.round(top + room / 2)}px`);
			} else {
				delete row.dataset.pin;
				row.style.removeProperty('--pin-top');
			}
		}
	};
	measure();
	addEventListener('resize', measure);
	if ('ResizeObserver' in window) {
		const resized = new ResizeObserver(measure);
		for (const row of rows) if (row.firstElementChild) resized.observe(row.firstElementChild);
	}
}

/**
 * data-motion records the mode on every scope: "scroll" where CSS has scroll timelines,
 * "time" otherwise. With the scroll a scope's parts follow its view timeline, forward and
 * back (data-play="scroll"), and the rows that fit the screen are pinned while their scene
 * plays. In time each scope plays once as it comes into view (playOnView). With reduced
 * motion nothing is turned on.
 */
export function reveal() {
	const scopes = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
	if (!scopes.length || reducedMotion()) return;
	const scroll = SCROLL_PATH.every((declaration) => CSS.supports(declaration));
	const below = scopes.filter(belowScreen);
	for (const scope of scopes) scope.dataset.motion = scroll ? 'scroll' : 'time';
	if (scroll) {
		for (const scope of below) scope.dataset.play = 'scroll';
		pinRows(below.filter((scope) => scope.matches('.skill')));
	} else {
		// A section starts as its top comes in; a skill's row, once its whole content is on screen
		// (or, taller than the screen, covers most of it), so its story is seen from its start.
		playOnView(below.filter((scope) => !scope.matches('.skill')));
		playOnView(below.filter((scope) => scope.matches('.skill')), { endsIn: (row) => row.firstElementChild });
	}
}
