import store from 'app/store';
import {
    LIGHT_THEME,
    DARK_THEME,
    CUSTOMIZABLE_THEMES,
    LIGHT_THEME_VALUES,
    DARK_THEME_VALUES,
    PARTS_LIST,
    BACKGROUND_PART,
} from 'app/features/Visualizer/constants';
import { THEMES_T } from 'app/features/Visualizer/definitions';
import { getThemeCssColor } from 'app/lib/getThemeCssColor';

// When the app's Workshop dark theme is active, the neutral visualizer
// background follows the Tailwind-backed `--surface-sunken` token instead of
// the theme Map's hardcoded value. Only the background is affected — every
// path/axis/limit/laser color is left untouched. Returns a *clone* so the
// shared module-level theme Maps are never mutated.
function withWorkshopBackground(
    theme: Map<string, string>,
): Map<string, string> {
    if (
        typeof document === 'undefined' ||
        !document.documentElement.classList.contains('dark')
    ) {
        return theme;
    }
    const background = getThemeCssColor('--surface-sunken');
    if (!background) {
        return theme;
    }
    const cloned = new Map(theme);
    cloned.set(BACKGROUND_PART, background);
    return cloned;
}

export function getVisualizerTheme(themeType?: THEMES_T): Map<string, string> {
    const theme = themeType || store.get('widgets.visualizer.theme');
    if (theme === LIGHT_THEME) {
        return withWorkshopBackground(LIGHT_THEME_VALUES as Map<string, string>);
    }
    if (theme === DARK_THEME) {
        return withWorkshopBackground(DARK_THEME_VALUES as Map<string, string>);
    }
    if ((CUSTOMIZABLE_THEMES as string[]).includes(theme)) {
        const colourMap = new Map<string, string>();
        (PARTS_LIST as string[]).forEach((part) =>
            colourMap.set(
                part,
                store.get(
                    'widgets.visualizer.' + theme + ' ' + part,
                    (DARK_THEME_VALUES as Map<string, string>).get(part),
                ),
            ),
        );
        return withWorkshopBackground(colourMap);
    }
    return withWorkshopBackground(DARK_THEME_VALUES as Map<string, string>);
}
