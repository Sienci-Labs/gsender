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
import { GCodeVirtualizer } from "@sienci/gviewer";
import type {
	LineModalState,
	LinePositionIndex,
	StepPosition,
} from "../definitions";

// The modal groups that change rarely enough to share one table entry across
// many lines. feedRate and spindleSpeed are deliberately absent — they change
// often enough that including them would defeat the deduping.
const MODAL_GROUP_KEYS = [
	"motion",
	"distance",
	"plane",
	"units",
	"feedMode",
	"coordinateSystem",
	"spindle",
	"coolant",
	"tool",
] as const satisfies readonly (keyof ModalState)[];

const modalSignature = (modals: ModalState): string =>
	MODAL_GROUP_KEYS.map((key) => modals[key]).join("|");

// modalForLine is a Uint16Array, so the table cannot exceed this. No real file
// comes close; past it we reuse the last entry rather than corrupt the index.
const MAX_MODAL_TABLE = 65535;

// Lines interpreted per chunk before yielding back to the event loop, so a
// large file doesn't lock the UI while the modal is opening.
const LINES_PER_CHUNK = 20000;

export interface BuildIndexOptions {
	onProgress?: (processed: number, total: number) => void;
	shouldAbort?: () => boolean;
	/**
	 * Whether an empty line advances the worker's frame counter.
	 *
	 * The worker splits content on the newline character alone, so in a CRLF
	 * file a "blank" line is really a lone carriage return. That has no tokens,
	 * so it takes GCodeVirtualizer's early return and emits no frame — unlike a
	 * truly empty line in an LF file, which does. Callers that stripped the
	 * carriage return when splitting have to say which ending the file used.
	 */
	blankLineEmitsFrame?: boolean;
}

/**
 * Walk the file with gviewer's own virtualizer — the same interpreter the
 * viewer uses to place its bit marker — and record the position reached at
 * every line.
 *
 * Positions are the raw work coordinates (always mm; the virtualizer converts
 * G20 inches itself), matching how the app feeds `setBitPosition`: for a rotary
 * file the toolpath is rotated about A by the viewer rather than the point
 * being pre-transformed.
 */
export async function buildLinePositionIndex(
	lines: string[],
	{
		onProgress,
		shouldAbort,
		blankLineEmitsFrame = true,
	}: BuildIndexOptions = {},
): Promise<LinePositionIndex | null> {
	const lineCount = lines.length;
	const positions = new Float32Array(lineCount * 4);
	const frameForLine = new Int32Array(lineCount);
	const modalForLine = new Uint16Array(lineCount);
	const feedRates = new Float32Array(lineCount);
	const spindleSpeeds = new Float32Array(lineCount);
	const modalTable: ModalState[] = [];
	const modalIndexBySignature = new Map<string, number>();
	let lastModalIndex = 0;
	const virtualizer = new GCodeVirtualizer();
	// Mirrors the visualize worker's frame counter: GCodeVirtualizer.virtualize()
	// runs its per-line callback (which is what pushes a frame) for empty lines
	// and for lines with at least one token, but returns early on a line whose
	// tokens are all comment — so a raw line number would drift from the frame
	// index by however many comment-only lines precede it.
	let frames = 0;

	for (let i = 0; i < lineCount; i++) {
		if (i > 0 && i % LINES_PER_CHUNK === 0) {
			onProgress?.(i, lineCount);
			// Yield so the modal can paint its loading state between chunks.
			await new Promise<void>((resolve) => setTimeout(resolve, 0));
			if (shouldAbort?.()) {
				return null;
			}
		}

		const line = lines[i];
		let emitsFrame = line === "" ? blankLineEmitsFrame : false;
		let modals: ModalState | null = null;
		if (line) {
			// A malformed line shouldn't abandon the rest of the index; the
			// position and modal state simply carry forward from the previous line.
			try {
				const result = virtualizer.processLine(line);
				emitsFrame = result.parsed.words.length > 0;
				modals = result.modals;
			} catch {
				/* ignore unparseable line */
			}
		}
		if (emitsFrame) {
			frames++;
		}
		frameForLine[i] = frames;

		if (modals) {
			// processLine returns a fresh snapshot each call, so the table can hold
			// the object as-is without aliasing the virtualizer's internal state.
			const signature = modalSignature(modals);
			let modalIndex = modalIndexBySignature.get(signature);
			if (modalIndex === undefined) {
				if (modalTable.length < MAX_MODAL_TABLE) {
					modalIndex = modalTable.length;
					modalTable.push(modals);
					modalIndexBySignature.set(signature, modalIndex);
				} else {
					modalIndex = lastModalIndex;
				}
			}
			lastModalIndex = modalIndex;
			feedRates[i] = modals.feedRate ?? Number.NaN;
			spindleSpeeds[i] = modals.spindleSpeed ?? Number.NaN;
		} else {
			// Blank, comment-only or unparseable: nothing changed.
			feedRates[i] = i > 0 ? feedRates[i - 1] : Number.NaN;
			spindleSpeeds[i] = i > 0 ? spindleSpeeds[i - 1] : Number.NaN;
		}
		modalForLine[i] = lastModalIndex;

		const position = virtualizer.getPosition();
		const offset = i * 4;
		positions[offset] = position.X;
		positions[offset + 1] = position.Y;
		positions[offset + 2] = position.Z;
		positions[offset + 3] = position.A;
	}

	onProgress?.(lineCount, lineCount);
	return {
		positions,
		frameForLine,
		modalTable,
		modalForLine,
		feedRates,
		spindleSpeeds,
		lineCount,
	};
}

/** Modal state in effect at a 1-based line number, or null before the index exists. */
export function modalsAtLine(
	index: LinePositionIndex | null,
	line: number,
): LineModalState | null {
	if (!index || index.lineCount === 0 || index.modalTable.length === 0) {
		return null;
	}
	const i = Math.max(0, Math.min(Math.floor(line) - 1, index.lineCount - 1));
	const modals = index.modalTable[index.modalForLine[i]];
	if (!modals) {
		return null;
	}
	return {
		modals,
		feedRate: index.feedRates[i],
		spindleSpeed: index.spindleSpeeds[i],
	};
}

/** Worker frame index for a 1-based line number, clamped to the file. */
export function frameAtLine(
	index: LinePositionIndex | null,
	line: number,
): number {
	if (!index || index.lineCount === 0) {
		return 0;
	}
	const i = Math.max(0, Math.min(Math.floor(line) - 1, index.lineCount - 1));
	return index.frameForLine[i];
}

/** Position at a 1-based line number, clamped to the file. */
export function positionAtLine(
	index: LinePositionIndex | null,
	line: number,
): StepPosition {
	if (!index || index.lineCount === 0) {
		return { x: 0, y: 0, z: 0, a: 0 };
	}
	const i = Math.max(0, Math.min(Math.floor(line) - 1, index.lineCount - 1));
	const offset = i * 4;
	return {
		x: index.positions[offset],
		y: index.positions[offset + 1],
		z: index.positions[offset + 2],
		a: index.positions[offset + 3],
	};
}
