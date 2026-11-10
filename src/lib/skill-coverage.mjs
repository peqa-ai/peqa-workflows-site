/**
 * Fails the build when `entries` (keyed by skill name) lacks a skill of the README table «Qué
 * le puedes pedir», or keeps one the table no longer lists. The error names the file to edit,
 * the release and each skill. `item` names what each entry is, for the message.
 *
 * @param {{ skills: string[], entries: Record<string, unknown>, file: string, tag: string, item?: string }} options
 */
export function assertSkillCoverage({ skills, entries, file, tag, item = '' }) {
	const missing = skills.filter((name) => !Object.hasOwn(entries, name));
	const stale = Object.keys(entries).filter((name) => !skills.includes(name));
	if (!missing.length && !stale.length) return;
	const problems = [
		missing.length && `faltan ${item}${missing.join(', ')}`,
		stale.length && `sobran ${item}${stale.join(', ')}`,
	].filter(Boolean);
	throw new Error(`${file} no coincide con la tabla «Qué le puedes pedir» de ${tag}: ${problems.join('; ')}.`);
}
