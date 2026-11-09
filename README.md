# peqa-workflows-site

Sitio de documentación de [PEQA workflows](https://github.com/peqa-ai/peqa-workflows), publicado en https://workflows.peqa.ai.

El sitio se genera del `README.md` de la última release del plugin. Cada sección `##` es una página de `/docs/`, y la portada toma de esa release la versión, la fecha, los comandos de instalación y la tabla de skills. La documentación se cambia en [peqa-workflows](https://github.com/peqa-ai/peqa-workflows), no aquí: el sitio la recoge cuando sale la siguiente release.

## Ejecutar en local

Necesitas Node 22.23.4 o posterior y acceso a la API de GitHub.

```sh
npm ci
npx playwright install --only-shell chromium
npm run dev
```

`npm run dev` y `npm run build` descargan primero la última release (`scripts/sync-release.mjs`). `npm test` prueba esa sincronización con una copia del README de v0.17.0. El build valida los enlaces internos.

Variables opcionales:

- `GITHUB_TOKEN` evita el límite de 60 peticiones por hora de la API sin autenticar.
- `CHROME_PATH` dibuja los diagramas Mermaid con un Chrome instalado en lugar del Chromium de Playwright. En macOS es `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
- `PUBLIC_FONT_BASE_URL` es el origen de la fuente Neue Machina, `https://peqa.ai` por defecto. La licencia de la fuente no permite incluir sus archivos en este repositorio. peqa.ai la sirve con CORS para workflows.peqa.ai; para probar en local, sirve los `.otf` desde un servidor propio que envíe CORS y apunta esta variable a él.

Si la release no se puede leer, o el README pierde la sección `## Instalar` con los bloques `sh` de Claude Code y Codex, la sincronización falla y el build se detiene. El sitio nunca publica comandos antiguos ni inventados.

## Despliegue

`.github/workflows/deploy.yml` compila y publica en GitHub Pages con cada push a `master`, cada 6 horas para recoger releases nuevas y a mano desde Actions. `ci.yml` prueba y compila cada pull request.

## Qué se edita aquí

- Las portadas: `src/content/docs/index.mdx` en español y `src/content/docs/en/index.mdx` en inglés.
- La frase de cada skill en la portada, en `src/data/skills.ts`. Si el plugin añade o renombra un skill, el build falla hasta que tenga su frase.
- Los tokens de diseño, copiados de peqa.ai, en `src/styles/tokens.css`, y su aplicación a Starlight en `src/styles/theme.css`.
- La sincronización, en `scripts/`.

`src/content/docs/docs/` y `src/generated/` se generan en cada build y Git los ignora.

## Licencia

[MIT](LICENSE).
