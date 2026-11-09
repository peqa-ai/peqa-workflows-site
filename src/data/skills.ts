// One sentence per skill for the landing, written from the plugin README (v0.17.0). The README
// table «Qué le puedes pedir» decides which skills appear and gives the Spanish example; the
// English example is its translation. A skill without a sentence here fails the build.
type SkillCopy = { summary: string; example?: string };

export const skillCopy: Record<'es' | 'en', Record<string, SkillCopy>> = {
	es: {
		dirige: {
			summary: 'Coordina la implementación con subagentes, integra y verifica su trabajo y entrega un PR que tú decides mezclar.',
		},
		idea: { summary: 'Cuestiona una idea o un plan desde el producto y la implementación, en tres rondas como máximo.' },
		'ui-design': { summary: 'Diseña o rediseña interfaces web y nativas desde los tokens y componentes de tu proyecto.' },
		revisa: { summary: 'Revisa un PR de forma independiente: pruebas, seguridad e impacto, con tres revisiones por PR como máximo.' },
		'memoria-guardar': { summary: 'Guarda en un PR las notas del proyecto que apruebas una a una.' },
		'memoria-extraer': { summary: 'Recupera las notas guardadas del proyecto, todas o por tema, sin modificarlas.' },
	},
	en: {
		dirige: {
			summary: 'Coordinates the implementation with subagents, integrates and checks their work, and delivers a PR you decide whether to merge.',
			example: 'Implement this change and coordinate the agents',
		},
		idea: {
			summary: 'Challenges an idea or a plan from the product and the implementation side, in three rounds at most.',
			example: 'Challenge this idea, from the implementation side too',
		},
		'ui-design': {
			summary: "Designs or redesigns web and native interfaces from your project's tokens and components.",
			example: 'Design the pricing page with the components we already have',
		},
		revisa: {
			summary: 'Reviews a PR independently: tests, security and impact, three reviews per PR at most.',
			example: 'Look for material bugs before closing this PR',
		},
		'memoria-guardar': {
			summary: 'Saves the project notes you approve, one by one, in a PR.',
			example: 'Save how we deploy this service',
		},
		'memoria-extraer': {
			summary: "Retrieves the project's saved notes, all of them or by topic, without changing them.",
			example: 'Retrieve what we know about DevOps in this project',
		},
	},
};
