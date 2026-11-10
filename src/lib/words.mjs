/**
 * The words of a request, to type them one by one: split at spaces, nothing added or lost, so
 * joined with single spaces they give the request back.
 *
 * @param {string} text
 * @returns {string[]}
 */
export const words = (text) => text.trim().split(/\s+/).filter(Boolean);
