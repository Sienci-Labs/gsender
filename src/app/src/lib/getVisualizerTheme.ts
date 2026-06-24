import { AYU_LIGHT_THEME, GRUVBOX_LIGHT_THEME } from "app/constants";
import {
	CUSTOMIZABLE_THEMES,
	DARK_THEME,
	DARK_THEME_VALUES,
	LIGHT_THEME,
	LIGHT_THEME_VALUES,
	PARTS_LIST,
} from "app/features/Visualizer/constants";
import type { THEMES_T } from "app/features/Visualizer/definitions";
import store from "app/store";

// Themes not natively understood by this legacy DRO/axis-label colour
// system fall back to LIGHT_THEME_VALUES or DARK_THEME_VALUES based on
// how the corresponding gviewer preset looks, instead of always dark.
const LIGHT_LIKE_THEMES: string[] = [LIGHT_THEME, GRUVBOX_LIGHT_THEME, AYU_LIGHT_THEME];

export function getVisualizerTheme(themeType?: THEMES_T): Map<string, string> {
	const theme = themeType || store.get("widgets.visualizer.theme");
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
					"widgets.visualizer." + theme + " " + part,
					(DARK_THEME_VALUES as Map<string, string>).get(part),
				),
			),
		);
		return colourMap;
	}
	return LIGHT_LIKE_THEMES.includes(theme)
		? (LIGHT_THEME_VALUES as Map<string, string>)
		: (DARK_THEME_VALUES as Map<string, string>);
}
