// Runs after rehype-mermaid (strategy inline-svg).
//
// Name and description: Mermaid names each diagram's <svg> with its accTitle (<title>, through
// aria-labelledby) and describes it with its accDescr (<desc>, through aria-describedby), but
// gives it role="graphics-document document", which exposes every node label to screen readers
// in DOM order. role="img" keeps the name and description and reads the diagram as one image.
//
// Layout: the diagram goes in a <figure class="diagram">. Mermaid's inline max-width keeps it at
// its natural width at most; theme.css fits it to the column on narrow screens (pinch zoom
// enlarges it, and its description gives the content as text).
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

			const figure = { type: 'element', tagName: 'figure', properties: { className: ['diagram', 'not-content'] }, children: [node] };
			parent.children[parent.children.indexOf(node)] = figure;
		});
	};
}
