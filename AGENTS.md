# AGENTS.md

Sitio Astro + Starlight de PEQA workflows (workflows.peqa.ai), generado de la última release de `peqa-ai/peqa-workflows`. Comandos y variables: `README.md` y `package.json`.

- La documentación vive en el `README.md` de peqa-workflows. Para cambiar un texto de `/docs/`, cámbialo allí; este repositorio solo transforma el README de la release publicada.
- `src/content/docs/docs/` y `src/generated/` los escribe `scripts/sync-release.mjs` en cada `dev` y `build`. Cambia el script, nunca su salida.
- Cuando la sincronización falla, corrige la causa en el script o en el README del plugin. El build debe fallar antes que publicar datos de otra release o escritos a mano.
- Cada cambio en `scripts/lib/` lleva su prueba en `test/` contra la copia del README en `test/fixtures/`.
- Colores, tamaños de texto, espacios y radios se escriben solo en `src/styles/tokens.css`. Componentes, tema y configuración los leen de ahí (`config/tokens.mjs` para Mermaid y Expressive Code).
- Neue Machina se carga desde `PUBLIC_FONT_BASE_URL`. Sus archivos `.otf` quedan fuera del repositorio: es público y la licencia no permite redistribuirlos.
- `src/data/skills.ts` tiene una frase por skill de la tabla «Qué le puedes pedir». Mantén las dos listas iguales.
- Las acciones de GitHub se fijan por SHA completo con la versión en un comentario.
