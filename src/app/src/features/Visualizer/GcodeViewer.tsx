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
	GCodeViewerThemePresetName,
	WorkerGeometryData,
} from "@sienci/gviewer/viewer";
import "@sienci/gviewer/viewer/viewcube.css";

import type { BBox } from "app/definitions/general";
import type { MachineProfile } from "app/definitions/firmware";
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
	AYU_DARK_THEME,
	AYU_LIGHT_THEME,
	DARK_THEME,
	FLEXOKI_DARK_THEME,
	GRBL,
	GRBL_ACTIVE_STATE_CHECK,
	GRBL_ACTIVE_STATE_IDLE,
	GRBL_ACTIVE_STATE_RUN,
	GRBLHAL,
	GRUVBOX_LIGHT_THEME,
	LASER_MODE,
	LIGHT_THEME,
	MARLIN,
	METRIC_UNITS,
	OUTLINE_MODE_RAPIDLESS_SQUARE,
	SMOOTHIE,
	TINYG,
	TOKYO_NIGHT_THEME,
	VISUALIZER_PRIMARY,
	VISUALIZER_SECONDARY,
	WORKFLOW_STATE_RUNNING,
} from "../../constants";

const THEME_NAME_TO_PRESET: Record<string, GCodeViewerThemePresetName> = {
	[LIGHT_THEME]: "light",
	[DARK_THEME]: "dark",
	[FLEXOKI_DARK_THEME]: "flexoki-dark",
	[TOKYO_NIGHT_THEME]: "tokyo-night",
	[GRUVBOX_LIGHT_THEME]: "gruvbox-light",
	[AYU_DARK_THEME]: "ayu-dark",
	[AYU_LIGHT_THEME]: "ayu-light",
};

const LIGHT_LIKE_PRESETS = new Set<GCodeViewerThemePresetName>(["light", "gruvbox-light", "ayu-light"]);

import { outlineResponse } from "../../workers/Outline.response";
import { getSafeXYMoveCode } from "app/features/DRO/utils/SafeMove";
import {
	computeKeepoutWorkRect,
	computeMachineBedWorkRect,
} from "app/features/DRO/utils/RapidPosition";
import type { Actions, CAMERA_POSITIONS_T, State } from "./definitions";

// "Move To Here": how long to hold before committing, and how far the pointer
// may drift before the gesture is treated as a pan instead of a placement.
const MOVE_TO_HERE_HOLD_MS = 500;
const MOVE_TO_HERE_CANCEL_PX = 8;

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

	lastHiddenLine = -1;

	// Theme selection in Settings only writes to the store once "Save" is
	// clicked, but the dropdown fires "theme:change" immediately for a live
	// preview. Track the previewed name here so the preview doesn't lag a
	// step behind the (not-yet-persisted) store value.
	previewThemeName: string | null = null;

	lastWposKey = "";

	lastMachineBedKey = "";

	lastGridKey = "";

	isRotaryFile = false;

	skipNextCameraFocus = false;

	lastConnected: boolean | null = null;

	lastSpinning: boolean | null = null;

	// "Move To Here" placement-mode state.
	moveToHereActive = false;

	mthPointerId: number | null = null;

	mthStart: { x: number; y: number } | null = null;

	mthTimer: ReturnType<typeof setTimeout> | null = null;

	mthIndicator: HTMLDivElement | null = null;

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
		this.setMoveToHereMode(false);
		this.viewer3d?.dispose();
		this.viewerSvg?.dispose();
		this.viewer3d = null;
		this.viewerSvg = null;
	}

	componentDidUpdate(prevProps: Props) {
		// Re-snap on every arm, not just when the camera position value
		// itself changes, since re-arming after a manual camera rotation
		// leaves `cameraPosition` unchanged (still "Top").
		const armingMoveToHere =
			!prevProps.state.moveToHere && this.props.state.moveToHere;
		if (
			prevProps.cameraPosition !== this.props.cameraPosition ||
			armingMoveToHere
		) {
			this.snapToView();
		}

		// "Move To Here" placement mode armed/disarmed.
		if (prevProps.state.moveToHere !== this.props.state.moveToHere) {
			this.setMoveToHereMode(this.props.state.moveToHere);
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
			this.containerRef.style.backgroundColor = this.buildTheme(this.currentThemeName()).background;
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
		// Restore the last known bit position on the fresh viewer. The redux wpos
		// subscription won't re-fire because the position key hasn't changed, so
		// the new viewer would otherwise start at origin.
		this.viewer3d?.setBitPosition(this.lastPosition, { immediate: true });
		this.viewerSvg?.setBitPosition(this.lastPosition);
		if (this.lastWorkerData) {
			this.applyWorkerData(this.lastWorkerData);
		}
	}

	// --- option/theme mapping ----------------------------------------------

	currentThemeName(): string {
		return (
			this.previewThemeName ??
			store.get("widgets.visualizer.theme", this.props.state.theme)
		);
	}

	buildTheme(themeName?: string): GCodeViewerTheme {
		const preset = THEME_NAME_TO_PRESET[themeName ?? ""] ?? "dark";
		const base = gCodeViewerThemePresets[preset];
		const boundingBox = LIGHT_LIKE_PRESETS.has(preset) ? "#1d4ed8" : "#93c5fd";
		const machineBed = LIGHT_LIKE_PRESETS.has(preset) ? "#b45309" : "#fbbf24";
		return {
			...base,
			colors: { ...base.colors, boundingBox, machineBed },
		};
	}

	buildOptions(): Partial<GCodeViewerOptions> {
		const { state } = this.props;
		const laser = isLaserMode();
		const isConnected = !!_get(reduxStore.getState(), "connection.isConnected");
		const toolVisible = this.cuttingToolVisible();
		const hideProcessed = store.get(
			"widgets.visualizer.hideProcessedLines",
			false,
		);

		const isMetric = state.units === METRIC_UNITS;

		return {
			units: isMetric ? "mm" : "in",
			mode: { laser, sim3d: false },
			bit: {
				// Bit only shows while connected, matching the old visualizer.
				enabled: isConnected && toolVisible,
				type: laser ? "laser" : "drill",
				// Matches the old bit.stl (68.67mm) scaled 0.5 → ~34mm tall; gviewer
				// scales the drill so largestDim = size * 1.6.
				size: 21.5,
				opacity: 0.9,
				// Position updates (jog + job run) arrive on the controller's
				// 250ms status-report poll. Tween duration needs to overlap
				// that cadence or the bit visibly pauses between updates.
				tweenMs: 260,
				colorSource: "custom",
				color: "#caf0f8",
			},
			progress: { mode: hideProcessed ? "hide" : "grey" },
			boundingBox: {
				visible: store.get("widgets.visualizer.objects.limits.visible", false),
				labels: store.get("widgets.visualizer.boundingBoxLabels", false),
			},
			machineBed: this.buildMachineBedOptions(),
			grid: this.buildGridOptions(),
			render: { antialias: true, theme: this.buildTheme(this.currentThemeName()) },
		};
	}

	// Grid quadrant tracks the connected controller's configured X/Y travel
	// ($130/$131), falling back to the machine profile until those settings
	// arrive. Quadrant edge is 2x the axis size, so each quadrant covers the
	// full bed regardless of which corner is "home". When "trim grid to bed"
	// is on and the bed indicator is actually shown, bounds override this
	// symmetric sizing with a box hugging the (possibly WCO-offset) bed rect.
	buildGridOptions(): {
		sizeX: number;
		sizeY: number;
		axisDepth: number;
		labels: boolean;
		bounds: { min: { x: number; y: number }; max: { x: number; y: number } } | null;
	} {
		const { state } = this.props;
		const isMetric = state.units === METRIC_UNITS;
		const unitScale = isMetric ? 1 : 1 / 25.4;
		const machineProfile = store.get("workspace.machineProfile") as
			| MachineProfile
			| undefined;
		const $130 = _get(reduxStore.getState(), "controller.settings.settings.$130");
		const $131 = _get(reduxStore.getState(), "controller.settings.settings.$131");
		const widthMm = $130 !== undefined ? Number($130) : (machineProfile?.mm?.width ?? 800);
		const depthMm = $131 !== undefined ? Number($131) : (machineProfile?.mm?.depth ?? 800);
		const heightMm = machineProfile?.mm?.height ?? 200;

		let bounds: { min: { x: number; y: number }; max: { x: number; y: number } } | null = null;
		const trimGridToBed = store.get(
			"widgets.visualizer.objects.machineBed.trimGridToBed",
			false,
		);
		if (trimGridToBed) {
			const bed = this.buildMachineBedOptions();
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

	buildMachineBedOptions(): {
		visible: boolean;
		min: { x: number; y: number } | null;
		max: { x: number; y: number } | null;
		keepout: { min: { x: number; y: number }; max: { x: number; y: number } } | null;
	} {
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

		let keepout: { min: { x: number; y: number }; max: { x: number; y: number } } | null = null;
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
		// SVG mode has no canvas clear color — sync the container background
		// so the theme's background shows instead of the page default.
		if (this.containerRef) {
			this.containerRef.style.backgroundColor = this.buildTheme(this.currentThemeName()).background;
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
		this.lastHiddenLine = -1;

		// Augment with toolchange count so gviewer only locks cut stream colors
		// when the file actually has toolchange palette assignments.
		const raw = data as any;
		const toolchangeCount: number = Array.isArray(raw.info?.toolchanges)
			? raw.info.toolchanges.length
			: 0;
		const augmented: WorkerGeometryData = { ...data, toolchangeCount };

		if (this.mode === "svg" && this.viewerSvg) {
			this.viewerSvg.loadFromWorkerData(augmented);
			this.firePostLoad();
			return;
		}

		if (this.viewer3d) {
			this.viewer3d
				.loadFromWorkerData(augmented)
				.then(() => {
					if (!this.skipNextCameraFocus) {
						this.viewer3d?.focusToModel();
					}
					this.skipNextCameraFocus = false;
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

	// --- "Move To Here" placement mode --------------------------------------

	// Arm/disarm the press-and-hold gesture. While armed, orbit rotation is
	// locked (pan + zoom stay live) so the click maps predictably onto the XY
	// plane, the cursor becomes a crosshair, and pointer listeners are live.
	setMoveToHereMode(enabled: boolean) {
		// Placement is a primary-visualizer concept; never arm on the secondary.
		if (enabled && this.props.isSecondary) {
			return;
		}

		this.moveToHereActive = enabled;
		const dom = this.containerRef;

		if (enabled) {
			this.viewer3d?.setRotateEnabled(false);
			if (dom) {
				dom.style.cursor = "crosshair";
				dom.addEventListener("pointerdown", this.handleMoveToHerePointerDown);
			}
			window.addEventListener("pointermove", this.handleMoveToHerePointerMove);
			window.addEventListener("pointerup", this.handleMoveToHerePointerUp);
			window.addEventListener("pointercancel", this.handleMoveToHerePointerUp);
		} else {
			this.viewer3d?.setRotateEnabled(true);
			if (dom) {
				dom.style.cursor = "";
				dom.removeEventListener(
					"pointerdown",
					this.handleMoveToHerePointerDown,
				);
			}
			window.removeEventListener(
				"pointermove",
				this.handleMoveToHerePointerMove,
			);
			window.removeEventListener("pointerup", this.handleMoveToHerePointerUp);
			window.removeEventListener(
				"pointercancel",
				this.handleMoveToHerePointerUp,
			);
			this.cancelMoveToHereHold();
		}
	}

	machineIsReadyToMove(): boolean {
		const st = reduxStore.getState();
		const isConnected = !!_get(st, "connection.isConnected");
		const activeState = _get(st, "controller.state.status.activeState");
		return isConnected && activeState === GRBL_ACTIVE_STATE_IDLE;
	}

	handleMoveToHerePointerDown = (e: PointerEvent) => {
		if (!this.moveToHereActive) {
			return;
		}
		// Primary (left mouse / touch) button only.
		if (e.button !== undefined && e.button !== 0) {
			return;
		}
		// Track a single pointer at a time (ignore multi-touch gestures).
		if (this.mthPointerId !== null) {
			return;
		}
		if (!this.machineIsReadyToMove()) {
			toast.info("Machine must be connected and idle to move");
			return;
		}

		this.mthPointerId = e.pointerId;
		this.mthStart = { x: e.clientX, y: e.clientY };
		this.showMoveToHereIndicator(e.clientX, e.clientY);

		const { clientX, clientY } = e;
		this.mthTimer = setTimeout(() => {
			this.commitMoveToHere(clientX, clientY);
		}, MOVE_TO_HERE_HOLD_MS);
	};

	handleMoveToHerePointerMove = (e: PointerEvent) => {
		if (this.mthPointerId === null || e.pointerId !== this.mthPointerId) {
			return;
		}
		if (!this.mthStart) {
			return;
		}
		const dx = e.clientX - this.mthStart.x;
		const dy = e.clientY - this.mthStart.y;
		// Movement beyond the threshold means the user is panning, not placing.
		if (Math.hypot(dx, dy) > MOVE_TO_HERE_CANCEL_PX) {
			this.cancelMoveToHereHold();
		}
	};

	handleMoveToHerePointerUp = (e: PointerEvent) => {
		if (this.mthPointerId === null || e.pointerId !== this.mthPointerId) {
			return;
		}
		// Released before the hold completed - cancel the placement.
		this.cancelMoveToHereHold();
	};

	cancelMoveToHereHold() {
		if (this.mthTimer) {
			clearTimeout(this.mthTimer);
			this.mthTimer = null;
		}
		this.removeMoveToHereIndicator();
		this.mthPointerId = null;
		this.mthStart = null;
	}

	commitMoveToHere(clientX: number, clientY: number) {
		this.cancelMoveToHereHold();

		if (!this.machineIsReadyToMove()) {
			toast.info("Machine must be connected and idle to move");
			this.props.actions.camera.disableMoveToHere();
			return;
		}

		// gviewer renders rotary toolpaths on an X-rotated root, so the picked
		// world XY is not a meaningful work coordinate for those files.
		if (this.isRotaryFile) {
			toast.info("Move To Here isn't available for rotary files");
			this.props.actions.camera.disableMoveToHere();
			return;
		}

		const target = this.getWorkCoordsFromClient(clientX, clientY);
		if (!target) {
			return;
		}

		const { units } = this.props.state;
		const unitModal = units === METRIC_UNITS ? "G21" : "G20";
		controller.command(
			"gcode:safe",
			getSafeXYMoveCode(target.x, target.y),
			unitModal,
		);

		toast.success(
			`Moving to X${target.x.toFixed(2)} Y${target.y.toFixed(2)}`,
		);

		// Auto-disarm after a successful move.
		this.props.actions.camera.disableMoveToHere();
	}

	// Convert a viewport pixel into absolute work XY. gviewer raycasts the pixel
	// onto the plane at the bit's current Z and returns scene coordinates, which
	// equal work coordinates because the toolpath root sits at the origin.
	getWorkCoordsFromClient(
		clientX: number,
		clientY: number,
	): { x: number; y: number } | null {
		if (!this.viewer3d) {
			return null;
		}
		const hit = this.viewer3d.screenToWorld(clientX, clientY);
		if (!hit) {
			return null;
		}
		return {
			x: Number(hit.x.toFixed(3)),
			y: Number(hit.y.toFixed(3)),
		};
	}

	showMoveToHereIndicator(clientX: number, clientY: number) {
		this.removeMoveToHereIndicator();

		const size = 48;
		const r = size / 2 - 4;
		const c = size / 2;
		const circumference = 2 * Math.PI * r;
		const ns = "http://www.w3.org/2000/svg";

		// Fixed positioning relative to the viewport so the indicator lands
		// exactly under the pointer regardless of ancestor positioning.
		const wrapper = document.createElement("div");
		wrapper.style.cssText = [
			"position:fixed",
			"pointer-events:none",
			"z-index:9999",
			`width:${size}px`,
			`height:${size}px`,
			"transform:translate(-50%,-50%)",
			`left:${clientX}px`,
			`top:${clientY}px`,
		].join(";");

		const svg = document.createElementNS(ns, "svg");
		svg.setAttribute("width", String(size));
		svg.setAttribute("height", String(size));

		const bg = document.createElementNS(ns, "circle");
		bg.setAttribute("cx", String(c));
		bg.setAttribute("cy", String(c));
		bg.setAttribute("r", String(r));
		bg.setAttribute("fill", "rgba(0,0,0,0.35)");
		bg.setAttribute("stroke", "rgba(255,255,255,0.4)");
		bg.setAttribute("stroke-width", "3");

		const progress = document.createElementNS(ns, "circle");
		progress.setAttribute("cx", String(c));
		progress.setAttribute("cy", String(c));
		progress.setAttribute("r", String(r));
		progress.setAttribute("fill", "none");
		progress.setAttribute("stroke", "#4ade80");
		progress.setAttribute("stroke-width", "3");
		progress.setAttribute("stroke-linecap", "round");
		progress.setAttribute("stroke-dasharray", `${circumference}`);
		progress.setAttribute("stroke-dashoffset", `${circumference}`);
		progress.setAttribute("transform", `rotate(-90 ${c} ${c})`);

		const dot = document.createElementNS(ns, "circle");
		dot.setAttribute("cx", String(c));
		dot.setAttribute("cy", String(c));
		dot.setAttribute("r", "2");
		dot.setAttribute("fill", "#4ade80");

		svg.appendChild(bg);
		svg.appendChild(progress);
		svg.appendChild(dot);
		wrapper.appendChild(svg);
		document.body.appendChild(wrapper);

		if (typeof progress.animate === "function") {
			progress.animate(
				[
					{ strokeDashoffset: circumference },
					{ strokeDashoffset: 0 },
				],
				{ duration: MOVE_TO_HERE_HOLD_MS, fill: "forwards" },
			);
		}

		this.mthIndicator = wrapper;
	}

	removeMoveToHereIndicator() {
		if (this.mthIndicator && this.mthIndicator.parentElement) {
			this.mthIndicator.parentElement.removeChild(this.mthIndicator);
		}
		this.mthIndicator = null;
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
		this.lastHiddenLine = -1;
		this.lastSpinning = false;
		this.viewer3d?.setBitSpinning(false);
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
				this.viewer3d?.setToolpathRotationA(this.isRotaryFile ? (this.lastPosition.a ?? 0) : 0);
			}),
			pubsub.subscribe("theme:change", (_msg, theme) => {
				this.previewThemeName = (theme as string) ?? null;
				this.applyOptionsFromState();
			}),
			pubsub.subscribe("visualizer:redraw", () => {
				this.applyOptionsFromState();
			}),
			pubsub.subscribe("visualizer:settings", () => {
				this.applyOptionsFromState();
			}),
			pubsub.subscribe("spindle:mode", () => {
				this.skipNextCameraFocus = true;
				this.applyOptionsFromState();
			}),
			pubsub.subscribe("litemode:change", () => {
				this.recreateViewer();
			}),
			pubsub.subscribe("job:end", () => {
				this.viewer3d?.showAll();
				this.viewer3d?.resetColors();
				this.lastHiddenLine = -1;
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

		// Mirror the old (redux-connected) visualizer: drive the bit position,
		// bit visibility and run-time progress greying from live controller state.
		this.reduxUnsub = reduxStore.subscribe(() => {
			const st = reduxStore.getState();

			// Track whether the loaded file uses the A axis — gates rotary rotation.
			// Fire setToolpathRotationA immediately on transition so the rotation
			// updates as soon as the file loads or changes, not just on next wpos tick.
			const fileType: string | undefined = _get(st, "file.fileType");
			if (fileType !== undefined) {
				const nextIsRotary = fileType === "ROTARY" || fileType === "FOUR_AXIS";
				if (nextIsRotary !== this.isRotaryFile) {
					this.isRotaryFile = nextIsRotary;
					this.viewer3d?.setToolpathRotationA(this.isRotaryFile ? (this.lastPosition.a ?? 0) : 0);
				}
			}

			// Bit follows the live work position (DRO) — jogging and running alike.
			const wpos = _get(st, "controller.wpos");
			if (wpos) {
				const key = `${wpos.x},${wpos.y},${wpos.z},${wpos.a ?? 0}`;
				if (key !== this.lastWposKey) {
					this.lastWposKey = key;
					this.lastPosition = {
						x: Number(wpos.x) || 0,
						y: Number(wpos.y) || 0,
						z: Number(wpos.z) || 0,
						a: Number(wpos.a) || 0,
					};
					this.viewer3d?.setBitPosition(this.lastPosition);
					this.viewerSvg?.setBitPosition(this.lastPosition);
					this.viewer3d?.setToolpathRotationA(this.isRotaryFile ? (this.lastPosition.a ?? 0) : 0);
				}
			}

			// Machine bed indicator tracks homing state, homing corner, and the
			// active WCS offset — all low-frequency changes, so gate the recompute
			// behind a dedupe key rather than reacting to every controller tick.
			const $22 = _get(st, "controller.settings.settings.$22", "0");
			const $23 = _get(st, "controller.settings.settings.$23", "0");
			const hasHomed = !!_get(st, "controller.hasHomed");
			const wco = _get(st, "controller.wco", { x: 0, y: 0 });
			const machineBedKey = `${$22},${$23},${hasHomed},${wco.x},${wco.y}`;
			if (machineBedKey !== this.lastMachineBedKey) {
				this.lastMachineBedKey = machineBedKey;
				this.viewer3d?.setOptions({
					machineBed: this.buildMachineBedOptions(),
				});
			}

			// Grid quadrant tracks the connected controller's X/Y travel settings
			// as soon as they arrive, rather than staying pinned to the machine
			// profile default until the next options rebuild. When "trim grid to
			// bed" is on, the grid also depends on the same homing/WCO state as
			// the bed indicator, so machineBedKey is folded in too.
			const $130 = _get(st, "controller.settings.settings.$130");
			const $131 = _get(st, "controller.settings.settings.$131");
			const gridKey = `${$130},${$131},${machineBedKey}`;
			if (gridKey !== this.lastGridKey) {
				this.lastGridKey = gridKey;
				this.viewer3d?.setOptions({
					grid: this.buildGridOptions(),
				});
			}

			// Bit is only shown while connected (matches the old behaviour).
			const connected = !!_get(st, "connection.isConnected");
			if (connected !== this.lastConnected) {
				this.lastConnected = connected;
				this.viewer3d?.setBitVisible(connected && this.cuttingToolVisible());
			}

			// Progress greying/hiding while a job runs: always grey, hide only when
			// the hideProcessedLines setting is on. Use hideUntilLine (not seekToLine)
			// so it never fights the DRO-driven bit position above.
			if (_get(st, "controller.workflow.state") === WORKFLOW_STATE_RUNNING) {
				const line =
					_get(st, "controller.sender.status.currentLineRunning", 0) ||
					_get(st, "controller.sender.status.received", 0);
				if (line !== this.lastHiddenLine && this.viewer3d) {
					this.lastHiddenLine = line;
					const mode = store.get("widgets.visualizer.hideProcessedLines", false)
						? "hide"
						: "grey";
					this.viewer3d.hideUntilLine(line, mode);
				}
			}

			// Spin the bit to simulate a running spindle.
			const spinning = this.computeShouldSpin(st, connected);
			if (spinning !== this.lastSpinning) {
				this.lastSpinning = spinning;
				this.viewer3d?.setBitSpinning(spinning);
			}
		});
	}

	computeShouldSpin(st: unknown, isConnected: boolean): boolean {
		if (!isConnected || !this.cuttingToolVisible()) {
			return false;
		}

		const controllerType = _get(st, "controller.type");
		if (controllerType === GRBL || controllerType === GRBLHAL) {
			// Trust the machine's own reported state, not the sender's workflow
			// state — the sender can finish queueing lines (workflow -> idle)
			// while grbl is still physically finishing buffered moves.
			const activeState = _get(st, "controller.state.status.activeState");
			return (
				activeState === GRBL_ACTIVE_STATE_RUN ||
				activeState === GRBL_ACTIVE_STATE_CHECK
			);
		}
		if (
			controllerType === MARLIN ||
			controllerType === SMOOTHIE ||
			controllerType === TINYG
		) {
			// No granular machine-state field available for these — fall back
			// to workflow state, matching the old visualizer's behaviour.
			return _get(st, "controller.workflow.state") === WORKFLOW_STATE_RUNNING;
		}
		return false;
	}

	cuttingToolVisible(): boolean {
		const { objects, liteMode } = this.props.state;
		return liteMode ? objects.cuttingTool.visibleLite : objects.cuttingTool.visible;
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
