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

import { METRIC_UNITS } from "app/constants";
import type { MachineProfile } from "app/definitions/firmware";
import {
	computeKeepoutWorkRect,
	computeMachineBedWorkRect,
} from "app/features/DRO/utils/RapidPosition";
import store from "app/store";
import { store as reduxStore } from "app/store/redux";
import _get from "lodash/get";

/**
 * Scene options shared by every gviewer instance in the app.
 *
 * The grid and machine bed are derived from the connected controller's settings
 * rather than from any one viewer's state, so the step-through modal and the
 * primary visualizer draw the same scene for the same machine.
 */

export interface MachineBedOptions {
	visible: boolean;
	min: { x: number; y: number } | null;
	max: { x: number; y: number } | null;
	keepout: {
		min: { x: number; y: number };
		max: { x: number; y: number };
	} | null;
}

export interface GridOptions {
	sizeX: number;
	sizeY: number;
	axisDepth: number;
	labels: boolean;
	bounds: {
		min: { x: number; y: number };
		max: { x: number; y: number };
	} | null;
}

export function buildMachineBedOptions(): MachineBedOptions {
	const state = reduxStore.getState();
	const $22 = _get(state, "controller.settings.settings.$22", "0");
	const $23 = _get(state, "controller.settings.settings.$23", "0");
	const hasHomed = !!_get(state, "controller.hasHomed");
	const homingEnabled = Number($22) > 0;
	const bedIndicatorEnabled = store.get(
		"widgets.visualizer.objects.machineBed.visible",
		false,
	);

	if (!bedIndicatorEnabled || !homingEnabled || !hasHomed) {
		return { visible: false, min: null, max: null, keepout: null };
	}

	const wco = _get(state, "controller.wco", { x: 0, y: 0 });
	const machineProfile = store.get("workspace.machineProfile") as
		| MachineProfile
		| undefined;
	const machineWidthMm = machineProfile?.mm?.width ?? 800;
	const machineDepthMm = machineProfile?.mm?.depth ?? 800;

	const { min, max } = computeMachineBedWorkRect({
		homingMaskSetting: $23,
		machineWidthMm,
		machineDepthMm,
		wcsOffset: {
			x: Number(wco.x) || 0,
			y: Number(wco.y) || 0,
		},
	});

	const $683 = _get(state, "controller.settings.settings.$683");
	const $684 = _get(state, "controller.settings.settings.$684");
	const $685 = _get(state, "controller.settings.settings.$685");
	const $686 = _get(state, "controller.settings.settings.$686");
	const $687 = _get(state, "controller.settings.settings.$687");

	let keepout: {
		min: { x: number; y: number };
		max: { x: number; y: number };
	} | null = null;
	const keepoutSettingsExist = [$683, $684, $685, $686, $687].every(
		(value) => value !== undefined,
	);
	if (keepoutSettingsExist) {
		const keepoutEnabled = Number($683) !== 0;
		const xMin = Number($684);
		const xMax = Number($686);
		const yMin = Number($685);
		const yMax = Number($687);
		const isZeroSquare = xMax - xMin === 0 && yMax - yMin === 0;
		if (keepoutEnabled && !isZeroSquare) {
			keepout = computeKeepoutWorkRect({
				xMin,
				xMax,
				yMin,
				yMax,
				wcsOffset: {
					x: Number(wco.x) || 0,
					y: Number(wco.y) || 0,
				},
			});
		}
	}

	return { visible: true, min, max, keepout };
}

// Grid quadrant tracks the connected controller's configured X/Y travel
// ($130/$131), falling back to the machine profile until those settings
// arrive. Quadrant edge is 2x the axis size, so each quadrant covers the
// full bed regardless of which corner is "home". When "trim grid to bed"
// is on and the bed indicator is actually shown, bounds override this
// symmetric sizing with a box hugging the (possibly WCO-offset) bed rect.
export function buildGridOptions(units: string): GridOptions {
	const isMetric = units === METRIC_UNITS;
	const unitScale = isMetric ? 1 : 1 / 25.4;
	const machineProfile = store.get("workspace.machineProfile") as
		| MachineProfile
		| undefined;
	const $130 = _get(reduxStore.getState(), "controller.settings.settings.$130");
	const $131 = _get(reduxStore.getState(), "controller.settings.settings.$131");
	const widthMm =
		$130 !== undefined ? Number($130) : (machineProfile?.mm?.width ?? 800);
	const depthMm =
		$131 !== undefined ? Number($131) : (machineProfile?.mm?.depth ?? 800);
	const heightMm = machineProfile?.mm?.height ?? 200;

	let bounds: {
		min: { x: number; y: number };
		max: { x: number; y: number };
	} | null = null;
	const trimGridToBed = store.get(
		"widgets.visualizer.objects.machineBed.trimGridToBed",
		false,
	);
	if (trimGridToBed) {
		const bed = buildMachineBedOptions();
		if (bed.visible && bed.min && bed.max) {
			// Round outward to the nearest major gridline spacing past each
			// edge (10mm metric, 25.4mm/1" imperial) so the trimmed edge
			// always lands exactly on a drawn gridline. A small epsilon
			// keeps floating-point noise from pushing an already-flush edge
			// out an extra step.
			const roundStep = isMetric ? 10 : 25.4;
			bounds = {
				min: {
					x: Math.floor((bed.min.x + 1e-6) / roundStep) * roundStep,
					y: Math.floor((bed.min.y + 1e-6) / roundStep) * roundStep,
				},
				max: {
					x: Math.ceil((bed.max.x - 1e-6) / roundStep) * roundStep,
					y: Math.ceil((bed.max.y - 1e-6) / roundStep) * roundStep,
				},
			};
		}
	}

	return {
		sizeX: 2 * widthMm * unitScale,
		sizeY: 2 * depthMm * unitScale,
		axisDepth: heightMm * unitScale,
		labels: true,
		bounds,
	};
}
