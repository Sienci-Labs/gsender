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

import { GCodeVirtualizer } from "@sienci/gviewer";
import type { LinePositionIndex, StepPosition } from "../definitions";

// Lines interpreted per chunk before yielding back to the event loop, so a
// large file doesn't lock the UI while the modal is opening.
const LINES_PER_CHUNK = 20000;

export interface BuildIndexOptions {
	onProgress?: (processed: number, total: number) => void;
	shouldAbort?: () => boolean;
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
	{ onProgress, shouldAbort }: BuildIndexOptions = {},
): Promise<LinePositionIndex | null> {
	const lineCount = lines.length;
	const positions = new Float32Array(lineCount * 4);
	const virtualizer = new GCodeVirtualizer();

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
		if (line) {
			// A malformed line shouldn't abandon the rest of the index; the
			// position simply carries forward from the previous line.
			try {
				virtualizer.processLine(line);
			} catch {
				/* ignore unparseable line */
			}
		}

		const position = virtualizer.getPosition();
		const offset = i * 4;
		positions[offset] = position.X;
		positions[offset + 1] = position.Y;
		positions[offset + 2] = position.Z;
		positions[offset + 3] = position.A;
	}

	onProgress?.(lineCount, lineCount);
	return { positions, lineCount };
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
