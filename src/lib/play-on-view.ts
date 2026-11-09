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

// Shares of the ending part at which the observer reports, so the start condition is checked
// again whenever that share changes, also when the screen or the part changes size.
const SHARES = Array.from({ length: 21 }, (_, index) => index / 20);

/** True once the ending part is all on screen or, taller than the screen, covers 60 % of it. */
function endingInView(entry: IntersectionObserverEntry) {
	if (!entry.isIntersecting) return false;
	const screen = entry.rootBounds?.height ?? innerHeight;
	const height = entry.boundingClientRect.height;
	const needed = height <= screen ? 1 : (0.6 * screen) / height;
	return entry.intersectionRatio >= needed - 0.01;
}

/**
 * Each element waits on its first frame (data-play="waiting"), then plays once ("run"). A
 * story CSS had already started on load, as the hero's, goes back to its first frame. By
 * default a story starts when its top passes 80 % of the screen's height. With `endsIn`, which
 * finds the part of an element where its story ends, it starts once that part is all on
 * screen, so the ending is seen; if that part is taller than the screen, once it covers 60 % of
 * the screen's height. Both are measured when the observer reports, never once at load, so a
 * rotation or a resize while the story waits cannot leave it unreachable. Without
 * IntersectionObserver nothing changes.
 */
export function playOnView(elements: Story[], { endsIn }: { endsIn?: (element: Story) => Element | null } = {}) {
	if (!('IntersectionObserver' in window)) return;
	for (const element of elements) {
		element.dataset.play = 'waiting';
		for (const animation of element.getAnimations({ subtree: true })) animation.currentTime = 0;
		const end = endsIn?.(element) ?? null;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => (end ? endingInView(entry) : entry.isIntersecting))) return;
				element.dataset.play = 'run';
				observer.disconnect();
			},
			end ? { threshold: SHARES } : { rootMargin: '0% 0% -20% 0%' },
		);
		observer.observe(end ?? element);
	}
}
