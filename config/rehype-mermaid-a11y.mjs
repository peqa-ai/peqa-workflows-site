// Runs after rehype-mermaid (strategy inline-svg).
//
// Name and description: Mermaid names each diagram's <svg> with its accTitle (<title>, through
// aria-labelledby) and describes it with its accDescr (<desc>, through aria-describedby), but
// gives it role="graphics-document document", which exposes every node label to screen readers
// in DOM order. role="img" keeps the name and description and reads the diagram as one image.
//
// Layout: the diagram goes in a <figure class="diagram"> that scrolls sideways. Mermaid's inline
// max-width is replaced by --diagram-width, the natural width from the viewBox, so theme.css can
// shrink the diagram to the column only down to --diagram-min-scale and size it in em: larger
// text enlarges the labels too. The figure is focusable and named by the diagram's title, so a
// keyboard can scroll it. A hint follows it, hidden until the figure actually overflows
// (astro.config.mjs adds the few lines that check, on load and on resize).
const isMermaidSvg = (node, prefix) =>
	node.type === 'element' && node.tagName === 'svg' && String(node.properties?.id ?? '').startsWith(`${prefix}-`);

function walk(node, visitor, parent = null) {
	visitor(node, parent);
	for (const child of [...(node.children ?? [])]) walk(child, visitor, node);
}

export function rehypeMermaidA11y({ prefix = 'mermaid' } = {}) {
	return (tree, file) => {
		walk(tree, (node, parent) => {
			if (!isMermaidSvg(node, prefix)) return;
			const { properties } = node;
			const labelledBy = properties.ariaLabelledBy;
			if (!labelledBy || !properties.ariaDescribedBy) {
				throw new Error(
					`${file.path ?? 'README'}: el diagrama Mermaid «${properties.id}» necesita accTitle y accDescr, ` +
						'que dan su nombre y su descripción accesibles. Añádelos en el README del plugin.',
				);
			}
			properties.role = 'img';
			delete properties.ariaRoleDescription;
			delete properties.ariaRoledescription;

			const width = Number(String(properties.viewBox ?? '').trim().split(/[\s,]+/)[2]);
			if (!(width > 0)) throw new Error(`${file.path ?? 'README'}: el diagrama Mermaid «${properties.id}» no tiene viewBox.`);
			const style = String(properties.style ?? '')
				.split(';')
				.filter((rule) => rule.trim() && !/^\s*max-width\s*:/.test(rule));
			style.push(`--diagram-width:${Math.ceil(width)}`);
			properties.style = style.join(';');

			const figure = {
				type: 'element',
				tagName: 'figure',
				properties: { className: ['diagram', 'not-content'], tabIndex: 0, ariaLabelledBy: labelledBy },
				children: [node],
			};
			const hint = {
				type: 'element',
				tagName: 'p',
				properties: { className: ['diagram-hint', 'not-content'], hidden: true },
				children: [{ type: 'text', value: 'Desliza o usa las flechas para ver el resto del diagrama.' }],
			};
			parent.children.splice(parent.children.indexOf(node), 1, figure, hint);
		});
	};
}
