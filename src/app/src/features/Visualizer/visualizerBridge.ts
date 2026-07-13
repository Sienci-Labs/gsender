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

import type { OverlayMarker } from "app/features/Plugins/types";

// Imperative surface the primary visualizer exposes to the plugin bridge so
// sandboxed plugin iframes (which can never touch the canvas directly) can pick
// points on the loaded job, draw markers, and control the camera. The GcodeViewer
// component owns the implementation and registers a handle on mount; the plugin
// bridge (`viewer:*` requests) resolves against whatever handle is currently
// registered.
export interface VisualizerBridgeHandle {
	screenToWorld(
		px: number,
		py: number,
	): { x: number; y: number; z: number } | null;
	worldToScreen(
		x: number,
		y: number,
		z?: number,
	): { x: number; y: number } | null;
	setRotateEnabled(on: boolean): void;
	setCameraView(view: "top" | "3d" | "front" | "left" | "right"): void;
	isRotaryFile(): boolean;
	armPick(
		mode: "click" | "hold",
		onPick: (p: {
			world: { x: number; y: number; z: number };
			screen: { x: number; y: number };
		}) => void,
		onHoldProgress?: (t: number) => void,
	): void;
	disarmPick(): void;
	setOverlay(markers: OverlayMarker[]): void;
}

// Only the PRIMARY viewer registers a handle; the secondary (surfacing preview)
// visualizer never does, so `get()` always resolves to the main job viewer.
let current: VisualizerBridgeHandle | null = null;

export const visualizerBridge = {
	register(handle: VisualizerBridgeHandle): void {
		current = handle;
	},
	unregister(handle: VisualizerBridgeHandle): void {
		// Guard against a late-unmounting stale viewer clobbering a freshly
		// registered one.
		if (current === handle) {
			current = null;
		}
	},
	get(): VisualizerBridgeHandle | null {
		return current;
	},
};
