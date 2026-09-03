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
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "app/components/shadcn/Dialog";
import { FILE_TYPE, METRIC_UNITS } from "app/constants";
import { getLastWorkerGeometry } from "app/features/Visualizer/lastWorkerGeometry";
import { useTypedSelector } from "app/hooks/useTypedSelector";
import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import { cn } from "app/lib/utils";
import store from "app/store";
import { X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GCodeSourcePanel from "./components/GCodeSourcePanel";
import StepControls from "./components/StepControls";
import StepThroughScrubber from "./components/StepThroughScrubber";
import StepThroughStatus from "./components/StepThroughStatus";
import StepThroughVisualizer, {
	type StepThroughVisualizerHandle,
} from "./components/StepThroughVisualizer";
import ToolVisibilityPanel from "./components/ToolVisibilityPanel";
import type { LinePositionIndex } from "./definitions";
import {
	buildLinePositionIndex,
	frameAtLine,
	modalsAtLine,
	positionAtLine,
} from "./utils/linePositionIndex";
import {
	activeToolIndexForLine,
	buildStepperTools,
	buildToolFrameGroups,
} from "./utils/tools";

interface GcodeStepperProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Line-by-line inspection of the loaded file.
 *
 * `currentLine` is the single piece of navigation state: every control routes
 * through goToLine(), and the source row, cutter marker, axis readout, active
 * tool and scrubber all read back off it. Nothing keeps its own idea of where
 * in the file we are.
 */
export const GcodeStepper: React.FC<GcodeStepperProps> = ({
	open,
	onOpenChange,
}) => {
	const {
		content,
		total,
		usedAxes,
		fileType,
		toolSet,
		spindleToolEvents,
		estimatedTime,
	} = useTypedSelector((state) => state.file);
	const { units = METRIC_UNITS } = useWorkspaceState();

	const [currentLine, setCurrentLine] = useState(1);
	const [hiddenTools, setHiddenTools] = useState<Set<number>>(new Set());
	const [index, setIndex] = useState<LinePositionIndex | null>(null);
	const [indexProgress, setIndexProgress] = useState(0);
	const [geometry, setGeometry] = useState<WorkerGeometryData | null>(null);
	// True only while the scrubber thumb is held. Drives the source panel's
	// deferred re-centring; everything else still tracks the drag live.
	const [scrubbing, setScrubbing] = useState(false);
	// Seeded from the app-wide setting so the modal opens matching the primary
	// visualizer, but toggling here is modal-local and never writes back.
	const [hideProcessed, setHideProcessed] = useState(() =>
		store.get("widgets.visualizer.hideProcessedLines", false),
	);
	const [isPlaying, setIsPlaying] = useState(false);
	const [playbackSpeed, setPlaybackSpeed] = useState(10);

	const viewerRef = useRef<StepThroughVisualizerHandle>(null);

	// Only split while the modal is up — this component stays mounted alongside
	// the file info panel, and a large file shouldn't pay for it when closed.
	const lines = useMemo(
		() => (open && content ? content.split(/\r?\n/) : []),
		[open, content],
	);
	const totalLines = lines.length || total || 0;

	const tools = useMemo(
		() => buildStepperTools(spindleToolEvents, totalLines, toolSet),
		[spindleToolEvents, totalLines, toolSet],
	);

	const isRotaryFile =
		fileType === FILE_TYPE.ROTARY || fileType === FILE_TYPE.FOUR_AXIS;
	const showAAxis = (usedAxes ?? []).includes("A");

	const goToLine = useCallback(
		(line: number) => {
			if (totalLines === 0) {
				return;
			}
			setCurrentLine(Math.min(totalLines, Math.max(1, Math.round(line))));
		},
		[totalLines],
	);

	// Any manual navigation — scrubbing, a step button, clicking a source line
	// or a tool card — interrupts playback rather than fighting it.
	const goToLineManual = useCallback(
		(line: number) => {
			setIsPlaying(false);
			goToLine(line);
		},
		[goToLine],
	);

	// Grab the geometry the visualize worker already produced, and reset
	// navigation, each time the modal opens.
	useEffect(() => {
		if (!open) {
			return;
		}
		setGeometry(getLastWorkerGeometry());
		setCurrentLine(1);
		setHiddenTools(new Set());
		setScrubbing(false);
		setIsPlaying(false);
		setHideProcessed(store.get("widgets.visualizer.hideProcessedLines", false));
	}, [open]);

	// Walk the file once per open to learn the position at every line.
	useEffect(() => {
		if (!open || lines.length === 0) {
			return;
		}

		let cancelled = false;
		setIndex(null);
		setIndexProgress(0);

		buildLinePositionIndex(lines, {
			// `lines` was split with CR stripped; tell the builder which ending the
			// file actually used so its frame counter matches the worker's.
			blankLineEmitsFrame: !content.includes("\r\n"),
			onProgress: (processed, count) => {
				if (!cancelled) {
					setIndexProgress(count > 0 ? processed / count : 1);
				}
			},
			shouldAbort: () => cancelled,
		})
			.then((built) => {
				if (!cancelled && built) {
					setIndex(built);
				}
			})
			.catch((err) => console.error("step-through line index failed", err));

		return () => {
			cancelled = true;
		};
	}, [open, lines, content]);

	const position = useMemo(
		() => positionAtLine(index, currentLine),
		[index, currentLine],
	);
	const frame = useMemo(
		() => frameAtLine(index, currentLine),
		[index, currentLine],
	);
	const modalState = useMemo(
		() => modalsAtLine(index, currentLine),
		[index, currentLine],
	);
	// The line before this one, so the status row can mark what this line changed.
	const previousModalState = useMemo(
		() => (currentLine > 1 ? modalsAtLine(index, currentLine - 1) : null),
		[index, currentLine],
	);

	// currentLine (via the index) is what drives the cutter marker and how much
	// of the toolpath is drawn as already processed. hideProcessed is a dependency
	// so flipping the toggle re-applies at the current line straight away.
	useEffect(() => {
		viewerRef.current?.seekTo(position, frame, hideProcessed ? "hide" : "grey");
	}, [position, frame, hideProcessed]);

	// Kept in sync every render so the playback effect below can read "where we
	// are right now" without depending on currentLine itself — depending on it
	// directly would restart the RAF loop's anchor on every frame it produces.
	const currentLineRef = useRef(currentLine);
	currentLineRef.current = currentLine;

	// Advances currentLine on its own while playing, at a pace derived from the
	// file's own estimated run time so 10x (the default) reads as a fast but
	// legible preview rather than a real-time wait. There's no per-line timing
	// available (only a whole-file total), so the pace is one constant for the
	// whole file rather than varying with feed rate per line.
	useEffect(() => {
		if (!isPlaying || totalLines === 0) {
			return;
		}
		const FALLBACK_LINES_PER_SECOND = 100;
		const basePace =
			estimatedTime > 0 ? totalLines / estimatedTime : FALLBACK_LINES_PER_SECOND;
		const linesPerSecond = basePace * playbackSpeed;
		const startLine = currentLineRef.current;
		const startTime = performance.now();
		let rafId: number;

		const tick = () => {
			const elapsedSeconds = (performance.now() - startTime) / 1000;
			const nextLine = startLine + elapsedSeconds * linesPerSecond;
			if (nextLine >= totalLines) {
				goToLine(totalLines);
				setIsPlaying(false);
				return;
			}
			goToLine(nextLine);
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(rafId);
	}, [isPlaying, playbackSpeed, totalLines, estimatedTime, goToLine]);

	// Split the toolpath by tool so the Tools panel's eye buttons can hide one.
	// Needs the line index, which lands after the geometry does, so the viewer
	// reloads once when this becomes available.
	const toolLineGroups = useMemo(
		() => buildToolFrameGroups(tools, index),
		[tools, index],
	);

	const activeToolIndex = activeToolIndexForLine(tools, currentLine);

	const toggleTool = useCallback((toolIndex: number) => {
		setHiddenTools((prev) => {
			const next = new Set(prev);
			if (next.has(toolIndex)) {
				next.delete(toolIndex);
			} else {
				next.add(toolIndex);
			}
			return next;
		});
		// hiddenTools is the single source of truth: StepThroughVisualizer takes it
		// as a prop and re-applies it to gviewer, including after a reload, so
		// nothing has to be pushed imperatively from here.
	}, []);

	const indexing = index === null && lines.length > 0;
	// Only refreshed at rest — while playing or scrubbing the line changes too
	// fast for the text to be legible, so the box just holds its last value
	// rather than racing to keep up (or disappearing, which made the layout
	// jump every time playback/scrub state changed).
	const isIdle = !isPlaying && !scrubbing;
	const [displayedLine, setDisplayedLine] = useState({
		number: currentLine,
		text: lines[currentLine - 1] ?? "",
	});
	useEffect(() => {
		if (isIdle) {
			setDisplayedLine({ number: currentLine, text: lines[currentLine - 1] ?? "" });
		}
	}, [isIdle, currentLine, lines]);
	const lineGutterWidth = `${String(totalLines).length}ch`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{/* Tailwind runs with `important: true`, so a class here can't reliably
			    beat DialogContent's own `grid`/`p-6` — later source order wins, not
			    specificity. The layout therefore lives in a single stretched child
			    instead of re-declaring display on the dialog itself. */}
			<DialogContent className="h-[90vh] w-[92vw] [&>button:last-of-type]:hidden">
				<div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
					<div className="flex flex-shrink-0 items-center justify-between">
						<DialogTitle className="mb-0">G-code Step Through</DialogTitle>
						{/* The dialog's built-in 16px close affordance is too small to hit
						    on a touchscreen; it's hidden in favour of this one. */}
						<button
							type="button"
							aria-label="Close step through"
							onClick={() => onOpenChange(false)}
							className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-content-muted dark:hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<X className="h-6 w-6" />
						</button>
					</div>

					{/* Landscape: three columns, source | visualizer | tools. Portrait:
					    the visualizer moves to a full-width row on top, with source
					    and tools sharing a row beneath it — the narrow dialog width in
					    portrait can't fit all three side by side without squeezing
					    each one into uselessness. */}
					<div
						className={cn(
							"grid min-h-0 flex-1 gap-3",
							"grid-cols-[minmax(170px,1fr)_minmax(0,3fr)_minmax(180px,1fr)]",
							"portrait:grid-cols-2 portrait:grid-rows-[minmax(0,3fr)_minmax(180px,2fr)]",
						)}
					>
						<div className="min-h-0 portrait:order-2">
							<GCodeSourcePanel
								lines={lines}
								currentLine={currentLine}
								onSelectLine={goToLineManual}
								deferScroll={scrubbing}
							/>
						</div>

						<div className="flex min-h-0 flex-col gap-2 portrait:order-1 portrait:col-span-2">
							<div className="relative min-h-0 flex-1">
								<StepThroughVisualizer
									ref={viewerRef}
									geometry={geometry}
									isRotaryFile={isRotaryFile}
									units={units}
									initialPosition={position}
									lineGroups={toolLineGroups}
									hiddenGroups={hiddenTools}
								/>
								{indexing && (
									<div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
										Reading positions… {Math.round(indexProgress * 100)}%
									</div>
								)}
							</div>
							{/* Always mounted, even while playing/scrubbing, so this space
							    doesn't jump in and out of the layout on every state change —
							    it just stops refreshing (and dims) until idle again. The
							    source panel truncates long lines; this is the one place the
							    full text of the current line is readable without scrolling
							    that panel horizontally. */}
							<div
								data-testid="current-line-readout"
								className={cn(
									"flex max-h-24 flex-shrink-0 items-start gap-2 overflow-y-auto rounded-lg border border-gray-200 bg-white px-3 py-2 transition-opacity dark:border-outline dark:bg-surface-sunken",
									!isIdle && "opacity-50",
								)}
							>
								<span
									className="flex-shrink-0 select-none text-right font-mono text-xs text-gray-400 dark:text-content-muted"
									style={{ width: lineGutterWidth }}
								>
									{displayedLine.number}
								</span>
								<span className="whitespace-pre-wrap break-all font-mono text-xs text-gray-700 dark:text-content-secondary">
									{displayedLine.text}
								</span>
							</div>
						</div>

						<div className="min-h-0 portrait:order-3">
							<ToolVisibilityPanel
								tools={tools}
								activeToolIndex={activeToolIndex}
								hiddenTools={hiddenTools}
								onToggleTool={toggleTool}
								onSelectLine={goToLineManual}
								units={units}
							/>
						</div>
					</div>

					<div className="flex flex-shrink-0 flex-col gap-3">
						<StepThroughScrubber
							currentLine={currentLine}
							totalLines={totalLines}
							onScrub={(line) => {
								setIsPlaying(false);
								setScrubbing(true);
								goToLine(line);
							}}
							onScrubEnd={(line) => {
								goToLine(line);
								setScrubbing(false);
							}}
						/>
						<StepControls
							currentLine={currentLine}
							totalLines={totalLines}
							onStep={(delta) => goToLineManual(currentLine + delta)}
							isPlaying={isPlaying}
							speed={playbackSpeed}
							onSpeedChange={setPlaybackSpeed}
							onTogglePlay={() => {
								if (!isPlaying && currentLine >= totalLines) {
									goToLine(1);
								}
								setIsPlaying((prev) => !prev);
							}}
							onReset={() => {
								setIsPlaying(false);
								goToLine(1);
							}}
						/>
						<StepThroughStatus
							position={position}
							showAAxis={showAAxis}
							units={units}
							modalState={modalState}
							previousModalState={previousModalState}
							hideProcessed={hideProcessed}
							onToggleHideProcessed={() => setHideProcessed((prev) => !prev)}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default GcodeStepper;
