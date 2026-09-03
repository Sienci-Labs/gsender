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

import type { ModalState } from "@sienci/gviewer";

/** Machine position at a single G-code line, in millimetres. */
export interface StepPosition {
	x: number;
	y: number;
	z: number;
	a: number;
}

/**
 * Per-line position lookup for the loaded file.
 *
 * `positions` is a stride-4 Float32Array — [x, y, z, a] for each 0-based line
 * index — holding the position the machine has reached once that line has run.
 * Non-motion lines carry the position from the last motion line before them.
 */
/**
 * The G-code modal state in effect at a line, plus the feed and spindle values
 * that were current there.
 *
 * `modals` is the virtualizer's own ModalState; feed and speed are held apart
 * from it because they change far too often to dedupe (see LinePositionIndex).
 */
export interface LineModalState {
	modals: ModalState;
	/** Feed rate for this line, or NaN when the file has not set one yet. */
	feedRate: number;
	/** Spindle speed for this line, or NaN when the file has not set one yet. */
	spindleSpeed: number;
}

export interface LinePositionIndex {
	positions: Float32Array;
	/**
	 * Index into the visualize worker's `frames` array for each 0-based line —
	 * which is what gviewer's `hideUntilLine` counts in when geometry was loaded
	 * with `loadFromWorkerData`, since the worker only emits a frame for lines
	 * that reach GCodeVirtualizer's per-line callback.
	 */
	frameForLine: Int32Array;
	/**
	 * Distinct modal-group combinations seen in the file, in first-seen order.
	 *
	 * Real files use very few of these — a couple of thousand lines of CAM output
	 * typically produces under ten — so one shared entry per combination plus an
	 * index per line costs far less than a snapshot per line.
	 */
	modalTable: ModalState[];
	/** Index into `modalTable` for each 0-based line. */
	modalForLine: Uint16Array;
	/** Feed rate per 0-based line; NaN until the file sets one. */
	feedRates: Float32Array;
	/** Spindle speed per 0-based line; NaN until the file sets one. */
	spindleSpeeds: Float32Array;
	lineCount: number;
}

/** A tool used by the loaded file, with the line range it is active over. */
export interface StepperTool {
	/** 1-based ordinal in the file's toolchange sequence. */
	index: number;
	toolNumber: number;
	label: string;
	/** Hex colour matching this tool's paths in the visualizer. */
	color: string;
	/** 1-based inclusive line range this tool is active for. */
	startLine: number;
	endLine: number;
	/** Raw toolchange comment, when the post emitted one. */
	comment?: string;
	/** Diameter in mm, when one could be read out of the comment. */
	diameter?: number;
	/** Spindle speed in effect at the toolchange, when the file sets one. */
	spindleSpeed?: number;
}
