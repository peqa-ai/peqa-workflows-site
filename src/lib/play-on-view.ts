// Plays a story once as it comes into view, after peqa.ai's usePlayOnScroll
// (website src/lib/usePlayOnScroll.js). Only elements still below the screen at load wait, so
// nothing already visible changes; scene.css draws the states.

type Story = HTMLElement | SVGElement;

/** True with reduced motion: no story moves. */
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True while the element's top is below the bottom of the screen. */
export const belowScreen = (element: Element) => element.getBoundingClientRect().top >= innerHeight;

/**
 * Each element waits on its first frame (data-play="waiting") until its top passes 80 % of the
 * screen's height, then plays once ("run"). A story CSS had already started on load, as the
 * hero's, goes back to its first frame. Without IntersectionObserver nothing changes.
 */
export function playOnView(elements: Story[]) {
	if (!elements.length || !('IntersectionObserver' in window)) return;
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				(entry.target as Story).dataset.play = 'run';
				observer.unobserve(entry.target);
			}
		},
		{ rootMargin: '0% 0% -20% 0%' },
	);
	for (const element of elements) {
		element.dataset.play = 'waiting';
		for (const animation of element.getAnimations({ subtree: true })) animation.currentTime = 0;
		observer.observe(element);
	}
}
