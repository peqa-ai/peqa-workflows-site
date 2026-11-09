// Plays a story once as it comes into view, after peqa.ai's usePlayOnScroll
// (website src/lib/usePlayOnScroll.js). Only elements still below the screen at load wait, so
// nothing already visible changes; scene.css draws the states.

type Story = HTMLElement | SVGElement;

/** True with reduced motion: no story moves. */
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True while the element's top is below the bottom of the screen. */
export const belowScreen = (element: Element) => element.getBoundingClientRect().top >= innerHeight;

/** True while CSS hides the element (it has no box): it may appear later, anywhere. */
export const withoutBox = (element: Element) => element.getClientRects().length === 0;

// Shares of the ending part at which the observer reports while the page scrolls.
const SHARES = Array.from({ length: 21 }, (_, index) => index / 20);

/**
 * True once the ending part, `height` tall with `shown` of it on a screen `screen` tall, is all
 * on screen or, taller than the screen, covers 60 % of it. A part without a box is never shown.
 */
function endingShown(height: number, shown: number, screen: number) {
	if (height <= 0 || shown <= 0) return false;
	return height <= screen ? shown >= height - 1 : shown >= 0.6 * screen - 1;
}

/** The same test for an element, measured now against the window. */
function endingShownNow(part: Element) {
	const box = part.getBoundingClientRect();
	const shown = Math.min(box.bottom, innerHeight) - Math.max(box.top, 0);
	return endingShown(box.height, shown, innerHeight);
}

/**
 * Each element waits on its first frame (data-play="waiting"), then plays once ("run"). A
 * story CSS had already started on load, as the hero's, goes back to its first frame. By
 * default a story starts when its top passes 80 % of the screen's height. With `endsIn`, which
 * finds the part of an element where its story ends, it starts once that part is all on
 * screen, so the ending is seen; if that part is taller than the screen, once it covers 60 % of
 * the screen's height. That test uses the geometry of the moment: it runs as the page scrolls
 * and again whenever the window or that part changes size, so a rotation, a resize or a new
 * text size while the story waits can neither leave it unreachable nor skip a start that is
 * due. Without IntersectionObserver nothing changes.
 */
export function playOnView(elements: Story[], { endsIn }: { endsIn?: (element: Story) => Element | null } = {}) {
	if (!('IntersectionObserver' in window)) return;
	for (const element of elements) {
		element.dataset.play = 'waiting';
		for (const animation of element.getAnimations({ subtree: true })) animation.currentTime = 0;
		const end = endsIn?.(element) ?? null;
		if (!end) {
			const observer = new IntersectionObserver(
				(entries) => {
					if (!entries.some((entry) => entry.isIntersecting)) return;
					element.dataset.play = 'run';
					observer.disconnect();
				},
				{ rootMargin: '0% 0% -20% 0%' },
			);
			observer.observe(element);
			continue;
		}
		const start = () => {
			if (element.dataset.play === 'run') return;
			element.dataset.play = 'run';
			observer.disconnect();
			resized?.disconnect();
			removeEventListener('resize', check);
		};
		const check = () => {
			if (endingShownNow(end)) start();
		};
		const observer = new IntersectionObserver(
			(entries) => {
				const shown = entries.some((entry) =>
					endingShown(entry.boundingClientRect.height, entry.intersectionRect.height, entry.rootBounds?.height ?? innerHeight),
				);
				if (shown) start();
			},
			{ threshold: SHARES },
		);
		const resized = 'ResizeObserver' in window ? new ResizeObserver(check) : null;
		observer.observe(end);
		resized?.observe(end);
		addEventListener('resize', check);
	}
}
