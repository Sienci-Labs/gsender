/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import type {
	GCodeViewerTheme,
	GCodeViewerThemePresetName,
} from "@sienci/gviewer/viewer";
import { gCodeViewerThemePresets } from "@sienci/gviewer/viewer";
import {
	AYU_DARK_THEME,
	AYU_LIGHT_THEME,
	DARK_THEME,
	FLEXOKI_DARK_THEME,
	GRUVBOX_LIGHT_THEME,
	LIGHT_THEME,
	TOKYO_NIGHT_THEME,
} from "app/constants";
import store from "app/store";

export const THEME_NAME_TO_PRESET: Record<string, GCodeViewerThemePresetName> =
	{
		[LIGHT_THEME]: "light",
		[DARK_THEME]: "dark",
		[FLEXOKI_DARK_THEME]: "flexoki-dark",
		[TOKYO_NIGHT_THEME]: "tokyo-night",
		[GRUVBOX_LIGHT_THEME]: "gruvbox-light",
		[AYU_DARK_THEME]: "ayu-dark",
		[AYU_LIGHT_THEME]: "ayu-light",
	};

export const LIGHT_LIKE_PRESETS = new Set<GCodeViewerThemePresetName>([
	"light",
	"gruvbox-light",
	"ayu-light",
]);

// Workshop High-Contrast overrides for gSender's own "dark" preset (the app's
// built-in dark mode). Other selectable schemes (tokyo-night, ayu-dark,
// flexoki-dark) are left on their own preset colors. Hex values mirror the
// Tailwind config's surface/outline/content tokens and brand color scales
// (see apps/desktop/tailwind.config.ts) — the canvas can't consume Tailwind
// classes, so the same configured hex is used literally here.
export const WORKSHOP_VISUALIZER_COLORS = {
	background: "#090D12", // surface.sunken
	gridMajor: "#72849D", // outline.strong
	gridMinor: "#3F4B59", // outline.subtle
	axisX: "#dc2626", // red.500
	axisY: "#059669", // green.500
	axisZ: "#3F85C7", // blue.500
	rapid: "#059669", // green.500
	cutting: "#3F85C7", // blue.500
	processed: "#59687B", // outline.DEFAULT
	boundingBox: "#659dd2", // blue.300
	machineBed: "#c27924", // orange.400
	bit: "#79aad8", // blue.200
	// The step-through modal's position marker. Deliberately outside
	// TOOLPATH_COLOR_HEXES (see Visualizer/constants.ts): that palette walks the
	// hue wheel in mid-tones, and 187° is its widest gap — between #42D7BA (168°)
	// and #4296D7 (205°) — at a saturation and brightness neither reaches, so the
	// marker can't be mistaken for a tool's toolpath.
	stepMarker: "#00E5FF",
};

/**
 * The visualizer theme name currently persisted in the store. Callers that
 * support live preview (the Settings dropdown fires `theme:change` before the
 * store is written) should pass their previewed name to buildViewerTheme
 * instead of relying on this.
 */
export const currentViewerThemeName = (fallback?: string): string =>
	store.get("widgets.visualizer.theme", fallback);

export function buildViewerTheme(themeName?: string): GCodeViewerTheme {
	const preset = THEME_NAME_TO_PRESET[themeName ?? ""] ?? "dark";
	const base = gCodeViewerThemePresets[preset];

	if (preset === "dark") {
		const c = WORKSHOP_VISUALIZER_COLORS;
		return {
			...base,
			background: c.background,
			colors: {
				...base.colors,
				grid: { major: c.gridMajor, minor: c.gridMinor },
				axes: { x: c.axisX, y: c.axisY, z: c.axisZ },
				rapid: c.rapid,
				cutting: c.cutting,
				processed: c.processed,
				boundingBox: c.boundingBox,
				machineBed: c.machineBed,
			},
		};
	}

	const boundingBox = LIGHT_LIKE_PRESETS.has(preset) ? "#1d4ed8" : "#93c5fd";
	const machineBed = LIGHT_LIKE_PRESETS.has(preset) ? "#b45309" : "#fbbf24";
	return {
		...base,
		colors: { ...base.colors, boundingBox, machineBed },
	};
}
