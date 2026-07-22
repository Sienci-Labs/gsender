/**
 * Reads a Tailwind-backed CSS custom property (defined in index.css, resolved
 * from the shared Tailwind config) off the document root at runtime.
 *
 * Use this for consumers that cannot apply Tailwind utility classes directly —
 * WebGL/canvas visualizers, react-select inline styles, etc. — so theme colors
 * are never duplicated as hardcoded values in JS/TS.
 *
 * Returns an empty string when the variable is not defined (e.g. before the
 * stylesheet loads, or when the relevant theme scope is inactive); callers
 * should fall back to their existing value in that case.
 */
export function getThemeCssColor(variable: string): string {
    if (typeof document === 'undefined') {
        return '';
    }
    return getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
}
