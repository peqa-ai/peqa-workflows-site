// Texts of the hero scene (Scene.astro), copied as they are from peqa.ai's project sheet for
// PEQA workflows: website src/data/work.js, scene `peqa-workflows` (2026-11-09). `label` tells
// the scene's story to assistive technology. The request and the PR number are examples.
// `pullRequest`, the header of the PR window, is this site's own (round 1 of scoring).
type SceneCopy = {
	label: string;
	session: string;
	command: string;
	request: string;
	subagents: string;
	agents: { name: string; file: string }[];
	review: string;
	noFindings: string;
	pullRequest: string;
	pr: string;
	prTitle: string;
	open: string;
	ask: string;
	merge: string;
	later: string;
};

export const sceneCopy: Record<'es' | 'en', SceneCopy> = {
	es: {
		label:
			'En una sesión de agente, /peqa-workflows:dirige recibe un pedido, tres subagentes lo implementan en paralelo, se abre un PR, la primera de hasta tres revisiones sale sin hallazgos y la persona decide mezclarlo.',
		session: '~/proyecto',
		command: '/peqa-workflows:dirige',
		request: 'Añade la exportación a CSV',
		subagents: 'Subagentes',
		agents: [
			{ name: 'API', file: 'api/export.ts' },
			{ name: 'Interfaz', file: 'ExportButton.tsx' },
			{ name: 'Pruebas', file: 'export.test.ts' },
		],
		review: 'Revisión 1 de 3',
		noFindings: 'Sin hallazgos',
		pullRequest: 'Pull request',
		pr: 'PR #42',
		prTitle: 'Exportación a CSV',
		open: 'Abierto',
		ask: '¿Mezclar?',
		merge: 'Sí, mezclar',
		later: 'Ahora no',
	},
	en: {
		label:
			'In an agent session, /peqa-workflows:dirige takes a request, three subagents build it in parallel, a PR opens, the first of up to three reviews finds nothing and the person decides to merge it.',
		session: '~/project',
		command: '/peqa-workflows:dirige',
		request: 'Add CSV export',
		subagents: 'Subagents',
		agents: [
			{ name: 'API', file: 'api/export.ts' },
			{ name: 'UI', file: 'ExportButton.tsx' },
			{ name: 'Tests', file: 'export.test.ts' },
		],
		review: 'Review 1 of 3',
		noFindings: 'No findings',
		pullRequest: 'Pull request',
		pr: 'PR #42',
		prTitle: 'CSV export',
		open: 'Open',
		ask: 'Merge?',
		merge: 'Yes, merge',
		later: 'Not now',
	},
};
