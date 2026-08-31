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

import type { WorkerGeometryData } from "@sienci/gviewer/viewer";
import { GCodeViewer } from "@sienci/gviewer/viewer";
import { IMPERIAL_UNITS } from "app/constants";
import {
	buildGridOptions,
	buildMachineBedOptions,
} from "app/features/Visualizer/viewerOptions";
import {
	buildViewerTheme,
	currentViewerThemeName,
	WORKSHOP_VISUALIZER_COLORS,
} from "app/features/Visualizer/viewerTheme";
import { isLaserMode } from "app/lib/laserMode";
import store from "app/store";
import type React from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { StepPosition } from "../definitions";

export interface StepThroughVisualizerHandle {
	/**
	 * Move to the state for the current line: the cutter marker to `position`,
	 * and the processed-geometry cursor to `frame`.
	 *
	 * Rotary files spin the whole toolpath about A rather than pre-transforming
	 * the point, matching how the primary visualizer places its bit.
	 */
	seekTo: (position: StepPosition, frame: number) => void;
}

interface StepThroughVisualizerProps {
	geometry: WorkerGeometryData | null;
	isRotaryFile: boolean;
	units: string;
	initialPosition: StepPosition;
}

/**
 * The step-through modal's own gviewer instance.
 *
 * Renders the geometry the visualize worker already produced for the primary
 * visualizer — same buffers, so the toolpath colours (including the per-tool
 * palette) match the Tools panel — with the camera pinned top-down on open and
 * the ViewCube left in place for reorientation.
 *
 * Scene options are built from the same shared helpers the primary visualizer
 * uses, so the grid, axis extents and machine bed are identical for a given
 * machine. Only the bit differs: a bright point for positional clarity rather
 * than a rendered tool.
 */
export const StepThroughVisualizer = forwardRef<
	StepThroughVisualizerHandle,
	StepThroughVisualizerProps
>(({ geometry, isRotaryFile, units, initialPosition }, ref) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<GCodeViewer | null>(null);
	// Latest requested state, so it can be re-applied once an async load settles
	// and so a burst of scrub events collapses into one frame of work.
	const pendingRef = useRef<{ position: StepPosition; frame: number }>({
		position: initialPosition,
		frame: 0,
	});
	const rafRef = useRef<number | null>(null);
	// Frames queued to settle the camera after a load; cancelled if the modal
	// closes first so nothing touches a disposed viewer.
	const cameraRafRef = useRef<number | null>(null);

	const cancelCameraFrames = () => {
		if (cameraRafRef.current !== null) {
			cancelAnimationFrame(cameraRafRef.current);
			cameraRafRef.current = null;
		}
	};

	const applyPending = () => {
		rafRef.current = null;
		const viewer = viewerRef.current;
		if (!viewer) {
			return;
		}
		const { position, frame } = pendingRef.current;
		viewer.setToolpathRotationA(isRotaryFile ? position.a : 0);
		viewer.setBitPosition(
			{ x: position.x, y: position.y, z: position.z, a: position.a },
			{ immediate: true },
		);
		// No mode argument, so it follows options.progress.mode (the app's
		// hideProcessedLines setting) exactly like a running job does. This only
		// recolours the delta since the last cursor and restores the base colours
		// when moving backwards, so scrubbing in reverse un-greys on its own.
		viewer.hideUntilLine(frame);
	};

	const seekTo = (position: StepPosition, frame: number) => {
		pendingRef.current = { position, frame };
		// A long scrub drag can outpace the renderer — recolouring a big vertex
		// range on every pointermove is the expensive part, so coalesce to one
		// update per frame.
		if (rafRef.current === null) {
			rafRef.current = requestAnimationFrame(applyPending);
		}
	};

	useImperativeHandle(ref, () => ({ seekTo }));

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const laser = isLaserMode();
		const viewer = new GCodeViewer({
			id: "gcode-step-through",
			container,
			options: {
				units: units === IMPERIAL_UNITS ? "in" : "mm",
				mode: { laser, sim3d: false },
				bit: {
					enabled: true,
					// A small bright point rather than a rendered tool: this view is
					// about where the cutter is, not what it looks like. gviewer forces
					// the laser bit under laser mode anyway, and its beam reads the
					// same way.
					type: laser ? "laser" : "circle",
					// gviewer draws this as a sphere of radius size*0.65, so 3 is a
					// ~3.9-wide dot — half the width it started at, small enough not to
					// bury the toolpath around the current position.
					size: 3,
					opacity: 1,
					// Stepping should land instantly, not tween behind the scrubber.
					tweenMs: 0,
					colorSource: "custom",
					color: WORKSHOP_VISUALIZER_COLORS.bit,
				},
				progress: {
					mode: store.get("widgets.visualizer.hideProcessedLines", false)
						? "hide"
						: "grey",
				},
				// Deliberately not the user's `objects.limits.visible` setting: the
				// rest of the scene mirrors the primary visualizer, but this view is
				// for reading the cutter's position against the toolpath, and the
				// bounding box wireframe and its labels only clutter that.
				boundingBox: { visible: false, labels: false },
				machineBed: buildMachineBedOptions(),
				grid: buildGridOptions(units),
				render: {
					antialias: true,
					theme: buildViewerTheme(currentViewerThemeName()),
				},
			},
		});
		viewerRef.current = viewer;

		return () => {
			viewerRef.current = null;
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			cancelCameraFrames();
			viewer.dispose();
		};
		// The viewer is created once for the life of the modal; units, theme and
		// machine settings are read at open time.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const viewer = viewerRef.current;
		if (!viewer || !geometry) {
			return;
		}

		let cancelled = false;
		viewer
			.loadFromWorkerData(geometry)
			.then(() => {
				if (cancelled || viewerRef.current !== viewer) {
					return;
				}

				// focusToModel() centres the camera's orbit target on the toolpath,
				// but only advances it inside gviewer's animation loop — nothing is
				// applied synchronously. snapCameraToView(), meanwhile, reads the
				// target immediately, so calling the two back to back frames the
				// origin rather than the model. Zero the tween and let a frame pass
				// so the target has actually landed before snapping top-down.
				viewer.setOptions({ camera: { focusDurationMs: 0 } });
				viewer.focusToModel();

				cameraRafRef.current = requestAnimationFrame(() => {
					cameraRafRef.current = requestAnimationFrame(() => {
						cameraRafRef.current = null;
						if (cancelled || viewerRef.current !== viewer) {
							return;
						}
						// No distance override: focusToModel has already set the
						// camera at gviewer's own framing distance for these bounds.
						viewer.snapCameraToView("top", { durationMs: 0 });
						applyPending();
					});
				});

				applyPending();
			})
			.catch((err) => console.error("step-through gviewer load failed", err));

		return () => {
			cancelled = true;
			cancelCameraFrames();
		};
	}, [geometry]);

	return (
		<div
			ref={containerRef}
			// gviewer appends its ViewCube into this container and offers no option
			// to suppress it. display:none (what `hidden` gives) is required rather
			// than opacity — the cube sets pointer-events:auto, so anything less
			// leaves its six buttons as dead click targets over the canvas.
			className="h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-outline [&_.gViewer-viewcube]:hidden"
		/>
	);
});

StepThroughVisualizer.displayName = "StepThroughVisualizer";

export default StepThroughVisualizer;
