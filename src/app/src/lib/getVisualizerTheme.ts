import store from 'app/store';
import {
    LIGHT_THEME,
    DARK_THEME,
    CUSTOMIZABLE_THEMES,
    LIGHT_THEME_VALUES,
    DARK_THEME_VALUES,
    PARTS_LIST,
} from 'app/features/Visualizer/constants';

export function getVisualizerTheme(): Map<string, string> {
    const { theme } = store.get('widgets.visualizer') as { theme: string };
    if (theme === LIGHT_THEME) {
        return LIGHT_THEME_VALUES as Map<string, string>;
    }
    if (theme === DARK_THEME) {
        return DARK_THEME_VALUES as Map<string, string>;
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
        return colourMap;
    }
    return DARK_THEME_VALUES as Map<string, string>;
}
