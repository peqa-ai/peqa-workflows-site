import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		// `install: true` puts the install commands of the latest release in the hero (the landings).
		schema: docsSchema({ extend: z.object({ install: z.boolean().default(false) }) }),
	}),
	// Strings of this site's own components, next to Starlight's built-in UI translations.
	i18n: defineCollection({
		loader: i18nLoader(),
		schema: i18nSchema({
			extend: z.object({
				'peqa.install.title': z.string(),
				'peqa.install.then': z.string(),
				'peqa.language.label': z.string(),
				'peqa.language.href': z.string(),
				'peqa.language.lang': z.string(),
			}),
		}),
	}),
};
