// One sentence per skill for the landing, written from the plugin README (v0.17.0). The README
// table «Qué le puedes pedir» decides which skills appear and gives the Spanish example; the
// English example is its translation. A skill without a sentence here fails the build.
type SkillCopy = { summary: string; example?: string };

export const skillCopy: Record<'es' | 'en', Record<string, SkillCopy>> = {
	es: {
		dirige: {
			summary: 'Coordina subagentes, integra y verifica su trabajo, y entrega un PR que tú decides mezclar.',
		},
		idea: { summary: 'Cuestiona una idea o un plan, en tres rondas como máximo.' },
		'ui-design': { summary: 'Diseña interfaces desde los tokens y componentes de tu proyecto. Opus y Codex puntúan el resultado.' },
		revisa: { summary: 'Revisa un PR de forma independiente: pruebas, seguridad e impacto. Tres revisiones por PR como máximo.' },
		'memoria-guardar': { summary: 'Guarda en un PR las notas del proyecto que apruebas una a una.' },
		'memoria-extraer': { summary: 'Recupera las notas guardadas, todas o por tema, sin modificarlas.' },
	},
	en: {
		dirige: {
			summary: 'Coordinates subagents, integrates and checks their work, and delivers a PR you decide whether to merge.',
			example: 'Implement this change and coordinate the agents',
		},
		idea: {
			summary: 'Challenges an idea or a plan, in three rounds at most.',
			example: 'Challenge this idea, from the implementation side too',
		},
		'ui-design': {
			summary: "Designs interfaces from your project's tokens and components. Opus and Codex score the result.",
			example: 'Design the pricing page with the components we already have',
		},
		revisa: {
			summary: 'Reviews a PR independently: tests, security and impact. Three reviews per PR at most.',
			example: 'Look for material bugs before closing this PR',
		},
		'memoria-guardar': {
			summary: 'Saves the project notes you approve, one by one, in a PR.',
			example: 'Save how we deploy this service',
		},
		'memoria-extraer': {
			summary: "Retrieves the saved notes, all of them or by topic, without changing them.",
			example: 'Retrieve what we know about DevOps in this project',
		},
	},
};
