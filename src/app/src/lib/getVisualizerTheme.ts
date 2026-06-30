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
	return DARK_THEME_VALUES as Map<string, string>;
}
