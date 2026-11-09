// Expressive Code (code blocks and the landing's <Code>) themed with the site tokens. It lives
// in its own file because customizeTheme is a function, which astro.config.mjs cannot pass on.
import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import { loadTokens } from './config/tokens.mjs';

const token = loadTokens();


export default defineEcConfig({
	themes: ['min-dark'],
	customizeTheme: (theme) => {
		// Monochrome code, as on peqa.ai: text in --color-text, comments in --color-text-muted,
		// on the panel the page actually shows (Expressive Code checks contrast against it).
		theme.bg = token('--color-code-bg');
		theme.fg = token('--color-text');
		theme.colors['editor.background'] = token('--color-code-bg');
		theme.colors['editor.foreground'] = token('--color-text');
		for (const { scope, settings } of theme.settings) {
			if (!settings?.foreground) continue;
			const scopes = [scope ?? []].flat().join(' ');
			settings.foreground = /comment/.test(scopes) ? token('--color-text-muted') : token('--color-text');
		}
		return theme;
	},
	styleOverrides: {
		borderRadius: token('--radius'),
		borderColor: token('--color-code-border'),
		codeBackground: token('--color-code-bg'),
		frames: {
			editorBackground: token('--color-code-bg'),
			editorActiveTabBackground: token('--color-code-bg'),
			editorTabBarBackground: token('--color-surface'),
			editorTabBarBorderBottomColor: token('--color-code-border'),
			terminalBackground: token('--color-code-bg'),
			terminalTitlebarBackground: token('--color-surface'),
			terminalTitlebarBorderBottomColor: token('--color-code-border'),
			terminalTitlebarForeground: token('--color-text-muted'),
			terminalTitlebarDotsForeground: token('--color-border-strong'),
			inlineButtonForeground: token('--color-text'),
			inlineButtonBorder: token('--color-border-strong'),
			tooltipSuccessBackground: token('--color-accent'),
			tooltipSuccessForeground: token('--color-on-accent'),
			frameBoxShadowCssValue: 'none',
		},
	},
});
