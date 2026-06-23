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

import {
	GCodeSVGRenderer as GViewerSVG,
	GCodeViewer as GViewer3D,
	gCodeViewerThemePresets,
} from "@sienci/gviewer/viewer";
import type {
	GCodeSVGOptions,
	GCodeViewerBitPosition,
	GCodeViewerCameraView,
	GCodeViewerOptions,
	GCodeViewerTheme,
	WorkerGeometryData,
} from "@sienci/gviewer/viewer";
import "@sienci/gviewer/viewer/viewcube.css";

import type { BBox } from "app/definitions/general";
import controller from "app/lib/controller";
import { isLaserMode } from "app/lib/laserMode";
import { getZUpTravel } from "app/lib/SoftLimits.js";
import { toast } from "app/lib/toaster";
import store from "app/store";
import { store as reduxStore } from "app/store/redux";
import _get from "lodash/get";
import pubsub from "pubsub-js";
import { Component } from "react";
import {
	LASER_MODE,
	LIGHT_THEME,
	METRIC_UNITS,
	OUTLINE_MODE_RAPIDLESS_SQUARE,
	VISUALIZER_PRIMARY,
	VISUALIZER_SECONDARY,
	WORKFLOW_STATE_RUNNING,
} from "../../constants";
import { outlineResponse } from "../../workers/Outline.response";
import type { Actions, CAMERA_POSITIONS_T, State } from "./definitions";

// Maps gSender's camera positions onto gviewer ViewCube presets.
const VIEW_MAP: Partial<Record<string, GCodeViewerCameraView>> = {
	Top: "top",
	"3D": "front-top-right",
	Front: "front",
	Left: "left",
	Right: "right",
};

interface Props {
	show: boolean;
	cameraPosition: CAMERA_POSITIONS_T;
	state: State;
	actions: Actions;
	containerID: string;
	isSecondary: boolean;
}

/**
 * Single reusable gcode visualizer backed by the @sienci/gviewer package.
 *
 * Replaces the legacy Visualizer.jsx / SVGVisualizer.jsx / VisualizerWrapper /
 * Primary+Secondary shells. The existing worker pipeline (Visualize.worker.ts)
 * still parses gcode and publishes `file:load` with WorkerGeometryData, which we
 * feed straight into gviewer via loadFromWorkerData — no re-parsing here.
 */
class GcodeViewer extends Component<Props> {
	containerRef: HTMLDivElement | null = null;

	viewer3d: GViewer3D | null = null;

	viewerSvg: GViewerSVG | null = null;

	mode: "3d" | "svg" = "3d";

	lastWorkerData: WorkerGeometryData | null = null;

	lastPosition: GCodeViewerBitPosition = { x: 0, y: 0, z: 0, a: 0 };

	pendingLoadCallback: ((arg: { bbox: BBox }) => void) | null = null;

	pubsubTokens: string[] = [];

	reduxUnsub: (() => void) | null = null;

	outlineRunning = false;

	lastSeekedLine = -1;

	componentDidMount() {
		this.createViewer();
		this.subscribe();

		// Render any geometry that arrived before mount.
		const existing = _get(this.props.state, "gcode.visualization");
		if (existing && (existing as WorkerGeometryData).vertices) {
			this.applyWorkerData(existing as WorkerGeometryData);
		}
	}

	componentWillUnmount() {
		this.unsubscribe();
		this.reduxUnsub?.();
		this.viewer3d?.dispose();
		this.viewerSvg?.dispose();
		this.viewer3d = null;
		this.viewerSvg = null;
	}

	componentDidUpdate(prevProps: Props) {
		if (prevProps.cameraPosition !== this.props.cameraPosition) {
			this.snapToView();
		}

		if (!prevProps.show && this.props.show) {
			this.viewer3d?.resize();
		}

		const prev = prevProps.state;
		const cur = this.props.state;
		if (
			prev.units !== cur.units ||
			prev.theme !== cur.theme ||
			prev.liteMode !== cur.liteMode ||
			prev.objects.cuttingTool.visible !== cur.objects.cuttingTool.visible ||
			prev.objects.limits.visible !== cur.objects.limits.visible
		) {
			this.applyOptionsFromState();
		}
	}

	// --- viewer lifecycle ---------------------------------------------------

	createViewer() {
		if (!this.containerRef) {
			return;
		}

		// SVG/lite mode is primary-only; secondary previews are always 3D.
		if (this.isSVGMode() && !this.props.isSecondary) {
			this.mode = "svg";
			this.viewerSvg = new GViewerSVG(this.containerRef, this.buildSvgOptions());
		} else {
			this.mode = "3d";
			this.viewer3d = new GViewer3D({
				id: this.props.containerID,
				container: this.containerRef,
				options: this.buildOptions(),
			});
			this.snapToView();
		}
	}

	recreateViewer() {
		this.viewer3d?.dispose();
		this.viewerSvg?.dispose();
		this.viewer3d = null;
		this.viewerSvg = null;
		this.createViewer();
		if (this.lastWorkerData) {
			this.applyWorkerData(this.lastWorkerData);
		}
	}

	// --- option/theme mapping ----------------------------------------------

	currentThemeName(): string {
		return store.get("widgets.visualizer.theme", this.props.state.theme);
	}

	buildTheme(themeName?: string): GCodeViewerTheme {
		return themeName === LIGHT_THEME
			? gCodeViewerThemePresets.light
			: gCodeViewerThemePresets.dark;
	}

	buildOptions(): Partial<GCodeViewerOptions> {
		const { state } = this.props;
		const laser = isLaserMode();
		const toolVisible = state.liteMode
			? state.objects.cuttingTool.visibleLite
			: state.objects.cuttingTool.visible;
		const hideProcessed = store.get(
			"widgets.visualizer.hideProcessedLines",
			false,
		);

		return {
			units: state.units === METRIC_UNITS ? "mm" : "in",
			mode: { laser, sim3d: false },
			bit: {
				enabled: toolVisible,
				type: laser ? "laser" : "drill",
				size: 4.05,
				opacity: 0.9,
				tweenMs: 100,
				colorSource: "cutting",
				color: "#ffffff",
			},
			progress: { mode: hideProcessed ? "hide" : "grey" },
			boundingBox: { visible: state.objects.limits.visible, labels: true },
			render: { antialias: true, theme: this.buildTheme(this.currentThemeName()) },
		};
	}

	buildSvgOptions(): Partial<GCodeSVGOptions> {
		const theme = this.buildTheme(this.currentThemeName());
		return {
			rapidColor: theme.colors.rapid,
			cutColor: theme.colors.cutting,
			boundingBoxColor: theme.colors.boundingBox,
			projectionMode: "isometric",
		};
	}

	applyOptionsFromState() {
		if (this.viewer3d) {
			this.viewer3d.setOptions(this.buildOptions());
		}
		if (this.viewerSvg) {
			this.viewerSvg.setOptions(this.buildSvgOptions());
		}
	}

	isSVGMode(): boolean {
		const liteMode = store.get("widgets.visualizer.liteMode", false);
		const svgEnabled =
			store.get("widgets.visualizer.liteOption", "Light") === "Light";
		return liteMode && svgEnabled;
	}

	// --- geometry -----------------------------------------------------------

	applyWorkerData(data: WorkerGeometryData) {
		this.lastWorkerData = data;

		if (this.mode === "svg" && this.viewerSvg) {
			this.viewerSvg.loadFromWorkerData(data);
			this.firePostLoad();
			return;
		}

		if (this.viewer3d) {
			this.viewer3d
				.loadFromWorkerData(data)
				.then(() => {
					this.viewer3d?.focusToModel();
					this.viewer3d?.setBitPosition(this.lastPosition, { immediate: true });
					this.firePostLoad();
				})
				.catch((err) => console.error("gviewer load failed", err));
		}
	}

	firePostLoad() {
		const bbox = this.computeBBox();
		controller.context = {
			...controller.context,
			xmin: bbox.min.x,
			xmax: bbox.max.x,
			ymin: bbox.min.y,
			ymax: bbox.max.y,
			zmin: bbox.min.z,
			zmax: bbox.max.z,
		};
		pubsub.publish("gcode:bbox", bbox);
		if (this.pendingLoadCallback) {
			this.pendingLoadCallback({ bbox });
			this.pendingLoadCallback = null;
		}
	}

	computeBBox(): BBox {
		const empty = { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };
		const positions = this.getToolpathHull();
		if (!positions.length) {
			return empty;
		}
		const min = { x: Infinity, y: Infinity, z: Infinity };
		const max = { x: -Infinity, y: -Infinity, z: -Infinity };
		for (let i = 0; i < positions.length; i += 3) {
			const x = positions[i];
			const y = positions[i + 1];
			const z = positions[i + 2];
			if (x < min.x) min.x = x;
			if (y < min.y) min.y = y;
			if (z < min.z) min.z = z;
			if (x > max.x) max.x = x;
			if (y > max.y) max.y = y;
			if (z > max.z) max.z = z;
		}
		return { min, max };
	}

	// --- camera -------------------------------------------------------------

	snapToView() {
		const view = VIEW_MAP[this.props.cameraPosition];
		if (view && this.viewer3d) {
			this.viewer3d.snapCameraToView(view);
		}
	}

	// --- imperative API consumed by the connected container (index.tsx) -----

	load(_name: string, visualization: unknown, callback?: (arg: { bbox: BBox }) => void) {
		if (callback) {
			this.pendingLoadCallback = callback;
		}
		// Geometry is delivered authoritatively via the `file:load` pubsub, so
		// only apply directly when we are handed worker data here.
		if (
			visualization &&
			typeof visualization === "object" &&
			(visualization as WorkerGeometryData).vertices
		) {
			this.applyWorkerData(visualization as WorkerGeometryData);
		}
	}

	unload() {
		this.lastWorkerData = null;
		this.lastSeekedLine = -1;
		this.viewer3d?.unload();
		this.viewerSvg?.clear();
		controller.context = {
			...controller.context,
			xmin: 0,
			xmax: 0,
			ymin: 0,
			ymax: 0,
			zmin: 0,
			zmax: 0,
		};
	}

	hasVisualization(): boolean {
		return !!this.lastWorkerData;
	}

	rerenderGCode() {
		if (this.lastWorkerData) {
			this.applyWorkerData(this.lastWorkerData);
		}
	}

	getToolpathHull(): Float32Array {
		if (!this.lastWorkerData) {
			return new Float32Array(0);
		}
		return new Float32Array(
			this.lastWorkerData.vertices,
			0,
			this.lastWorkerData.verticesLen,
		);
	}

	zoomFit = () => this.viewer3d?.focusToModel();
	lookAtCenter = () => this.viewer3d?.focusToModel();
	// gviewer drives zoom/pan through its orbit controls (mouse/touch); these
	// stay as no-ops so the legacy shortcut wiring keeps resolving.
	zoomIn = () => {};
	zoomOut = () => {};
	panUp = () => {};
	panDown = () => {};
	panLeft = () => {};
	panRight = () => {};

	// --- pubsub -------------------------------------------------------------

	subscribe() {
		this.pubsubTokens = [
			pubsub.subscribe("file:load", (_msg, data) => {
				const activeVisualizer = _get(
					reduxStore.getState(),
					"visualizer.activeVisualizer",
				);
				const isPrimaryActive =
					!this.props.isSecondary && activeVisualizer === VISUALIZER_PRIMARY;
				const isSecondaryActive =
					this.props.isSecondary && activeVisualizer === VISUALIZER_SECONDARY;
				if (!isPrimaryActive && !isSecondaryActive) {
					return;
				}
				this.maybeWarnInvalidLines(data);
				this.applyWorkerData(data as WorkerGeometryData);
			}),
			pubsub.subscribe("visualizer:updateposition", (_msg, data) => {
				this.lastPosition = { ...this.lastPosition, ...(data as object) };
				this.viewer3d?.setBitPosition(this.lastPosition);
				this.viewerSvg?.setBitPosition(this.lastPosition);
			}),
			pubsub.subscribe("theme:change", () => {
				this.applyOptionsFromState();
			}),
			pubsub.subscribe("visualizer:redraw", () => {
				this.applyOptionsFromState();
			}),
			pubsub.subscribe("visualizer:settings", () => {
				this.applyOptionsFromState();
			}),
			pubsub.subscribe("spindle:mode", () => {
				this.applyOptionsFromState();
			}),
			pubsub.subscribe("litemode:change", () => {
				this.recreateViewer();
			}),
			pubsub.subscribe("job:end", () => {
				this.viewer3d?.showAll();
				this.viewer3d?.resetColors();
				this.lastSeekedLine = -1;
			}),
			pubsub.subscribe("gcode:unload", () => {
				this.unload();
			}),
			pubsub.subscribe("unload:file", () => {
				this.unload();
			}),
			pubsub.subscribe("outline:start", () => {
				this.handleOutline();
			}),
		];

		// Drive "hide processed lines" from live sender status.
		this.reduxUnsub = reduxStore.subscribe(() => {
			const st = reduxStore.getState();
			if (_get(st, "controller.workflow.state") !== WORKFLOW_STATE_RUNNING) {
				return;
			}
			if (!store.get("widgets.visualizer.hideProcessedLines", false)) {
				return;
			}
			const line =
				_get(st, "controller.sender.status.currentLineRunning", 0) ||
				_get(st, "controller.sender.status.received", 0);
			if (line !== this.lastSeekedLine && this.viewer3d) {
				this.lastSeekedLine = line;
				this.viewer3d.seekToLine(line, "hide");
			}
		});
	}

	unsubscribe() {
		this.pubsubTokens.forEach((token) => pubsub.unsubscribe(token));
		this.pubsubTokens = [];
	}

	maybeWarnInvalidLines(data: unknown) {
		if (!store.get("widgets.visualizer.showWarning", false)) {
			return;
		}
		const invalidLines: string[] = _get(data, "parsedData.invalidLines", []);
		if (invalidLines.length === 0) {
			return;
		}
		const lineSample = invalidLines.slice(0, 5);
		const description = (
			<div className={"flex flex-col gap-2"}>
				<p>
					Detected {invalidLines.length} invalid lines on file load. Your job may
					not run correctly.
				</p>
				<p>Sample invalid lines found include:</p>
				<ol>
					{lineSample.map((line, i) => (
						<li className="text-xs" key={i}>
							-<b> {line}</b>
						</li>
					))}
				</ol>
			</div>
		);
		pubsub.publish("helper:info", {
			title: "Invalid Lines Detected",
			description,
		});
	}

	handleOutline() {
		if (this.outlineRunning) {
			return;
		}
		toast.info("Generating outline g-code...");
		this.outlineRunning = true;

		const vertices = this.getToolpathHull();
		const settings = _get(reduxStore.getState(), "controller.settings.settings", {});
		const homingEnabled = _get(settings, "$22", "0") !== "0";
		const zTravel = homingEnabled ? getZUpTravel(5) : 5;

		try {
			const outlineWorker = new Worker(
				new URL("../../workers/Outline.worker.ts", import.meta.url),
				{ type: "module" },
			);

			const laserOnOutline = store.get(
				"widgets.spindle.laser.laserOnOutline",
				false,
			);
			const spindleMode = store.get("widgets.spindle.mode");
			const isLaser = laserOnOutline && spindleMode === LASER_MODE;

			const outlineMode = store.get("workspace.outlineMode", "Detailed");
			const outlineSpeed = store.get("workspace.outlineSpeed", null);

			const isRapidless = outlineMode === OUTLINE_MODE_RAPIDLESS_SQUARE;
			const content = isRapidless ? reduxStore.getState().file.content : null;

			const maxRuntime = setTimeout(() => {
				outlineWorker.terminate();
				toast.error("Outline generation timed out. Please try again.");
				this.outlineRunning = false;
			}, 15000);

			outlineWorker.onmessage = ({ data }) => {
				clearTimeout(maxRuntime);
				outlineResponse({ data });
				this.outlineRunning = false;
			};
			outlineWorker.postMessage({
				isLaser,
				parsedData: isRapidless ? [] : vertices,
				mode: outlineMode,
				zTravel,
				...(isRapidless && { content }),
				outlineSpeed,
			});
		} catch (e) {
			console.error(e);
			this.outlineRunning = false;
		}
	}

	render() {
		return (
			<div
				ref={(el) => {
					this.containerRef = el;
				}}
				className="w-full h-full overflow-hidden rounded-lg outline-none"
				style={{ display: this.props.show ? undefined : "none" }}
			/>
		);
	}
}

export default GcodeViewer;
