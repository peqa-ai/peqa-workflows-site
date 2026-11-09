// Plays a story once as it comes into view, after peqa.ai's usePlayOnScroll
// (website src/lib/usePlayOnScroll.js). Only elements still below the screen at load wait, so
// nothing already visible changes; scene.css draws the states.

type Story = HTMLElement | SVGElement;

/** True with reduced motion: no story moves. */
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True while the element's top is below the bottom of the screen. */
export const belowScreen = (element: Element) => element.getBoundingClientRect().top >= innerHeight;

/**
 * Each element waits on its first frame (data-play="waiting"), then plays once ("run"). A
 * story CSS had already started on load, as the hero's, goes back to its first frame. By
 * default a story starts when its top passes 80 % of the screen's height. With `endsIn`, which
 * finds the part of an element where its story ends, it starts once that part is all on
 * screen, so the ending is seen; if that part is taller than the screen, once it covers 60 % of
 * the screen's height. Without IntersectionObserver nothing changes.
 */
export function playOnView(elements: Story[], { endsIn }: { endsIn?: (element: Story) => Element | null } = {}) {
	if (!('IntersectionObserver' in window)) return;
	for (const element of elements) {
		element.dataset.play = 'waiting';
		for (const animation of element.getAnimations({ subtree: true })) animation.currentTime = 0;
		const end = endsIn?.(element) ?? null;
		const height = end ? end.getBoundingClientRect().height : 0;
		const threshold = !end ? 0 : height <= innerHeight ? 1 : (0.6 * innerHeight) / height;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= threshold - 0.01)) return;
				element.dataset.play = 'run';
				observer.disconnect();
			},
			end ? { threshold } : { rootMargin: '0% 0% -20% 0%' },
		);
		observer.observe(end ?? element);
	}
}
