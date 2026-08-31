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
	buildViewerTheme,
	currentViewerThemeName,
	WORKSHOP_VISUALIZER_COLORS,
} from "app/features/Visualizer/viewerTheme";
import type React from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { StepPosition } from "../definitions";

export interface StepThroughVisualizerHandle {
	/**
	 * Move the cutter marker to the position for the current line. Rotary files
	 * spin the whole toolpath about A instead of pre-transforming the point,
	 * matching how the primary visualizer places its bit.
	 */
	setPosition: (position: StepPosition) => void;
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
 */
export const StepThroughVisualizer = forwardRef<
	StepThroughVisualizerHandle,
	StepThroughVisualizerProps
>(({ geometry, isRotaryFile, units, initialPosition }, ref) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<GCodeViewer | null>(null);
	// Latest position, so it can be re-applied once an async load settles.
	const positionRef = useRef<StepPosition>(initialPosition);

	const applyPosition = (position: StepPosition) => {
		positionRef.current = position;
		const viewer = viewerRef.current;
		if (!viewer) {
			return;
		}
		viewer.setToolpathRotationA(isRotaryFile ? position.a : 0);
		viewer.setBitPosition(
			{ x: position.x, y: position.y, z: position.z, a: position.a },
			{ immediate: true },
		);
	};

	useImperativeHandle(ref, () => ({ setPosition: applyPosition }));

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const viewer = new GCodeViewer({
			id: "gcode-step-through",
			container,
			options: {
				units: units === IMPERIAL_UNITS ? "in" : "mm",
				bit: {
					enabled: true,
					// A bright point rather than a rendered tool: this view is about
					// where the cutter is, not what it looks like.
					type: "circle",
					size: 6,
					opacity: 1,
					// Stepping should land instantly, not tween behind the scrubber.
					tweenMs: 0,
					colorSource: "custom",
					color: WORKSHOP_VISUALIZER_COLORS.bit,
				},
				boundingBox: { visible: false, labels: false },
				render: {
					antialias: true,
					theme: buildViewerTheme(currentViewerThemeName()),
				},
			},
		});
		viewerRef.current = viewer;

		return () => {
			viewerRef.current = null;
			viewer.dispose();
		};
		// The viewer is created once for the life of the modal; units and theme are
		// read at open time.
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
				viewer.focusToModel();
				// The modal always opens looking straight down, whatever the primary
				// visualizer's camera was left on.
				viewer.snapCameraToView("top", { durationMs: 0 });
				applyPosition(positionRef.current);
			})
			.catch((err) => console.error("step-through gviewer load failed", err));

		return () => {
			cancelled = true;
		};
	}, [geometry]);

	return (
		<div
			ref={containerRef}
			className="h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-outline"
		/>
	);
});

StepThroughVisualizer.displayName = "StepThroughVisualizer";

export default StepThroughVisualizer;
