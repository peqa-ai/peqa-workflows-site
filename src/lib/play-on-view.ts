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
 * default a story starts when its top passes 80 % of the screen's height. With `whole` it starts
 * once it is almost all on screen, so its end is seen too: 90 % of it, or, if it is taller than
 * the screen, enough of it to cover 60 % of the screen's height. Without IntersectionObserver
 * nothing changes.
 */
export function playOnView(elements: Story[], { whole = false } = {}) {
	if (!('IntersectionObserver' in window)) return;
	for (const element of elements) {
		element.dataset.play = 'waiting';
		for (const animation of element.getAnimations({ subtree: true })) animation.currentTime = 0;
		const height = element.getBoundingClientRect().height;
		const threshold = !whole ? 0 : height <= innerHeight ? 0.9 : (0.6 * innerHeight) / height;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= threshold - 0.01)) return;
				element.dataset.play = 'run';
				observer.disconnect();
			},
			whole ? { threshold } : { rootMargin: '0% 0% -20% 0%' },
		);
		observer.observe(element);
	}
}
