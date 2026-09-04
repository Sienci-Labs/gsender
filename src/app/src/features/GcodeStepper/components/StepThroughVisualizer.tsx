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
	LineRangeGroup,
	WorkerGeometryData,
} from "@sienci/gviewer/viewer";
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
import { augmentWorkerGeometry } from "app/features/Visualizer/workerGeometry";
import { isLaserMode } from "app/lib/laserMode";
import store from "app/store";
import type React from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { StepPosition } from "../definitions";

// Breathing room around the toolpath when framing it on open. gviewer's own
// framing uses 1.25; this view wants to sit closer.
const FIT_MARGIN = 1.05;

export interface StepThroughVisualizerHandle {
	/**
	 * Move to the state for the current line: the cutter marker to `position`,
	 * and the processed-geometry cursor to `frame`, drawn per `progressMode`.
	 *
	 * Rotary files spin the whole toolpath about A rather than pre-transforming
	 * the point, matching how the primary visualizer places its bit.
	 */
	seekTo: (
		position: StepPosition,
		frame: number,
		progressMode: "hide" | "grey",
	) => void;
}

interface StepThroughVisualizerProps {
	geometry: WorkerGeometryData | null;
	isRotaryFile: boolean;
	units: string;
	initialPosition: StepPosition;
	/**
	 * Frame ranges the toolpath is split into so they can be hidden separately —
	 * one per tool, indexed the same way `hiddenGroups` is. Omit them and the
	 * toolpath loads as a single pair of streams, where only a prefix can be
	 * hidden.
	 */
	lineGroups?: readonly LineRangeGroup[];
	/** Indices into `lineGroups` to hide. */
	hiddenGroups?: ReadonlySet<number>;
}

/**
 * Camera distance that fits the toolpath's XY footprint from directly above.
 *
 * gviewer's own framing (used by focusToModel and the ViewCube) is
 * `max(dx, dy) / 2 / tan(fov/2) * 1.25 + dz`, which ignores the viewport's
 * aspect ratio — fine for its angled default view, but too far out looking
 * straight down a pane that is wider than it is tall. Solving each axis against
 * the FOV that actually constrains it, with a tighter margin, fills the pane.
 *
 * Returns null when there is nothing to frame, so the caller can fall back to
 * gviewer's own distance rather than invent one.
 */
function topDownFitDistance(
	bounds: {
		min: { x: number; y: number; z: number };
		max: { x: number; y: number; z: number };
	} | null,
	fovDegrees: number,
	viewportAspect: number,
): number | null {
	if (!bounds) {
		return null;
	}
	const halfX = (bounds.max.x - bounds.min.x) / 2;
	const halfY = (bounds.max.y - bounds.min.y) / 2;
	const depth = bounds.max.z - bounds.min.z;
	if (!(halfX > 0) && !(halfY > 0)) {
		// A single point or an empty program — nothing meaningful to fit to.
		return null;
	}

	const tan = Math.tan((fovDegrees * Math.PI) / 180 / 2);
	if (!(tan > 0) || !(viewportAspect > 0)) {
		return null;
	}
	// Vertical FOV constrains Y directly; X is constrained by the horizontal FOV,
	// which is the vertical one widened by the aspect ratio.
	const forY = halfY / tan;
	const forX = halfX / (tan * viewportAspect);
	const distance = Math.max(forY, forX) * FIT_MARGIN + Math.max(0, depth);
	return Number.isFinite(distance) && distance > 0 ? distance : null;
}

/**
 * The step-through modal's own gviewer instance.
 *
 * Renders the geometry the visualize worker already produced for the primary
 * visualizer — same buffers, so the toolpath colours (including the per-tool
 * palette) match the Tools panel — framed top-down on the toolpath on open. The
 * ViewCube is hidden here (see the container's class list); orbiting still works.
 *
 * Scene options are built from the same shared helpers the primary visualizer
 * uses, so the grid, axis extents and machine bed are identical for a given
 * machine. Only the bit differs: a bright point for positional clarity rather
 * than a rendered tool.
 */
export const StepThroughVisualizer = forwardRef<
	StepThroughVisualizerHandle,
	StepThroughVisualizerProps
>((props, ref) => {
	const {
		geometry,
		isRotaryFile,
		units,
		initialPosition,
		lineGroups,
		hiddenGroups,
	} = props;
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<GCodeViewer | null>(null);
	// Latest requested state, so it can be re-applied once an async load settles
	// and so a burst of scrub events collapses into one frame of work.
	const pendingRef = useRef<{
		position: StepPosition;
		frame: number;
		progressMode: "hide" | "grey";
	}>({
		position: initialPosition,
		frame: 0,
		progressMode: "grey",
	});
	const rafRef = useRef<number | null>(null);
	// Frames queued to settle the camera after a load; cancelled if the modal
	// closes first so nothing touches a disposed viewer.
	const cameraRafRef = useRef<number | null>(null);
	// Framing is a one-shot per open. The line groups arrive with the line index,
	// well after the geometry does, so the toolpath is loaded a second time —
	// which must not yank the camera back from wherever the user has put it.
	const framedRef = useRef(false);
	// Read inside the load callback, which does not re-run when a tool is
	// toggled and would otherwise close over a stale set.
	const hiddenGroupsRef = useRef(hiddenGroups);

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
		const { position, frame, progressMode } = pendingRef.current;
		viewer.setToolpathRotationA(isRotaryFile ? position.a : 0);
		viewer.setBitPosition(
			{ x: position.x, y: position.y, z: position.z, a: position.a },
			{ immediate: true },
		);
		// The mode is passed per call rather than through options, so the in-modal
		// toggle takes effect immediately. This only recolours the delta since the
		// last cursor and restores the base colours when moving backwards, so
		// scrubbing in reverse un-greys on its own; "hide" never touches colours,
		// so switching between the two stays consistent without a resetColors().
		viewer.hideUntilLine(frame, progressMode);
	};

	const seekTo = (
		position: StepPosition,
		frame: number,
		progressMode: "hide" | "grey",
	) => {
		pendingRef.current = { position, frame, progressMode };
		// A long scrub drag can outpace the renderer — recolouring a big vertex
		// range on every pointermove is the expensive part, so coalesce to one
		// update per frame.
		if (rafRef.current === null) {
			rafRef.current = requestAnimationFrame(applyPending);
		}
	};

	// A load rebuilds every stream visible, so this runs after each one as well
	// as on every toggle.
	const applyGroupVisibility = () => {
		const viewer = viewerRef.current;
		if (!viewer || !lineGroups) {
			return;
		}
		const hidden = hiddenGroupsRef.current;
		for (let i = 0; i < lineGroups.length; i++) {
			viewer.setLineGroupVisible(i, !hidden?.has(i));
		}
	};

	useEffect(() => {
		hiddenGroupsRef.current = hiddenGroups;
		applyGroupVisibility();
		// applyGroupVisibility reads only the two values below plus the viewer ref.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hiddenGroups, lineGroups]);

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
					// Needs a gviewer build whose resolveBitColor covers every solid
					// bit type (src/viewer/bit/bit.ts). Up to 0.1.32 only the drill read
					// bit.color and the circle was hardcoded to its #c9883d orange,
					// which sat right next to the #F08A4F toolpath colour.
					colorSource: "custom",
					color: WORKSHOP_VISUALIZER_COLORS.stepMarker,
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
			// Must go through augmentWorkerGeometry: without the toolchange count
			// gviewer discards the worker's per-tool colours and draws every cut in
			// the theme's single cutting colour, so the Tools panel's colour chips
			// would not match the toolpath.
			.loadFromWorkerData(
				augmentWorkerGeometry(geometry),
				lineGroups ? { lineGroups } : undefined,
			)
			.then(() => {
				if (cancelled || viewerRef.current !== viewer) {
					return;
				}

				applyGroupVisibility();

				if (framedRef.current) {
					applyPending();
					return;
				}
				framedRef.current = true;

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
						// focusToModel has centred the target; now frame the XY
						// footprint for this pane rather than inheriting the distance
						// it computed for an angled view. Read the container here, not
						// at load time, so the aspect reflects the laid-out canvas.
						const el = containerRef.current;
						const distance = topDownFitDistance(
							viewer.getBounds(),
							viewer.getOptions().camera.fov,
							el ? el.clientWidth / Math.max(1, el.clientHeight) : 0,
						);
						viewer.snapCameraToView("top", {
							durationMs: 0,
							...(distance === null ? {} : { distance }),
						});
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
		// applyGroupVisibility and applyPending read refs, not render values.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [geometry, lineGroups]);

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
